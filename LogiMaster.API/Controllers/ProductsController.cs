using LogiMaster.Application.DTOs;
using LogiMaster.Application.Interfaces;
using LogiMaster.Domain.Entities;
using LogiMaster.Domain.Interfaces;
using LogiMaster.Infrastructure.Data.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Microsoft.AspNetCore.Authorization;

namespace LogiMaster.API.Controllers;

[Authorize(Policy = "Module.Produtos")]
[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly LogiMasterDbContext _context;

    public ProductsController(IProductService productService, IUnitOfWork unitOfWork, LogiMasterDbContext context)
    {
        _productService = productService;
        _unitOfWork = unitOfWork;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetAll(CancellationToken cancellationToken)
    {
        var products = await _productService.GetAllAsync(cancellationToken);
        return Ok(products);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var product = await _productService.GetByIdAsync(id, cancellationToken);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpGet("reference/{reference}")]
    public async Task<ActionResult<ProductDto>> GetByReference(string reference, CancellationToken cancellationToken)
    {
        var product = await _productService.GetByReferenceAsync(reference, cancellationToken);
        return product is null ? NotFound() : Ok(product);
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<ProductDto>>> Search([FromQuery] string term, CancellationToken cancellationToken)
    {
        var products = await _productService.SearchAsync(term, cancellationToken);
        return Ok(products);
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var product = await _productService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductDto>> Update(int id, [FromBody] UpdateProductDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var product = await _productService.UpdateAsync(id, dto, cancellationToken);
            return Ok(product);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> Deactivate(int id, CancellationToken cancellationToken)
    {
        var result = await _productService.DeactivateAsync(id, cancellationToken);
        return result ? NoContent() : NotFound();
    }

    [HttpPost("{id:int}/activate")]
    public async Task<ActionResult> Activate(int id, CancellationToken cancellationToken)
    {
        var result = await _productService.ActivateAsync(id, cancellationToken);
        return result ? NoContent() : NotFound();
    }

    // Endpoint antigo - mantido para compatibilidade
    [HttpPost("import-packaging")]
    public async Task<IActionResult> ImportPackaging(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Arquivo não enviado" });

        try
        {
            OfficeOpenXml.ExcelPackage.License.SetNonCommercialPersonal("LogiMaster");

            using var stream = file.OpenReadStream();
            using var package = new OfficeOpenXml.ExcelPackage(stream);
            var worksheet = package.Workbook.Worksheets[0];
            var rowCount = worksheet.Dimension?.Rows ?? 0;
            var updated = 0;
            var notFound = new List<string>();

            for (int row = 1; row <= rowCount; row++)
            {
                var reference = worksheet.Cells[row, 1].Text?.Trim().ToUpper();
                var unitsPerBoxText = worksheet.Cells[row, 2].Text?.Trim();

                if (string.IsNullOrEmpty(reference)) continue;
                if (!int.TryParse(unitsPerBoxText, out int unitsPerBox)) continue;

                var product = await _unitOfWork.Products.GetByReferenceAsync(reference, cancellationToken);
                if (product == null)
                {
                    notFound.Add(reference);
                    continue;
                }

                product.Update(product.Description, unitsPerBox, product.UnitWeight, product.UnitPrice,
                    product.Barcode, product.Notes, product.DefaultPackagingId, product.BoxesPerPallet);
                updated++;
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Ok(new { message = $"{updated} produtos atualizados", updated, notFoundCount = notFound.Count, notFound = notFound.Take(10).ToList() });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Erro ao processar: {ex.Message}" });
        }
    }

    // Importa catálogo: A=Descrição, B=Cliente, C=Referência
    // Cria clientes (sem duplicatas), cria/atualiza produtos e vincula cliente-produto
    [HttpPost("import-catalog")]
    public async Task<IActionResult> ImportFromCatalog(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Arquivo não enviado" });

        try
        {
            OfficeOpenXml.ExcelPackage.License.SetNonCommercialPersonal("LogiMaster");

            using var stream = file.OpenReadStream();
            using var package = new OfficeOpenXml.ExcelPackage(stream);
            var worksheet = package.Workbook.Worksheets[0];
            var rowCount = worksheet.Dimension?.Rows ?? 0;

            // Coleta todas as linhas válidas
            var rows = new List<(string Description, string CustomerName, string Reference)>();
            for (int row = 1; row <= rowCount; row++)
            {
                var description = worksheet.Cells[row, 1].Text?.Trim();
                var customerName = worksheet.Cells[row, 2].Text?.Trim();
                var reference = worksheet.Cells[row, 3].Text?.Trim().ToUpper();

                if (string.IsNullOrEmpty(reference)) continue;
                rows.Add((description ?? reference, customerName ?? "", reference));
            }

            // Fase 1: Processa clientes únicos — cache nome → id
            var customersCreated = 0;
            var customerCache = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            var uniqueNames = rows
                .Where(r => !string.IsNullOrEmpty(r.CustomerName))
                .Select(r => r.CustomerName)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            foreach (var name in uniqueNames)
            {
                var existing = (await _unitOfWork.Customers.SearchAsync(name, cancellationToken))
                    .FirstOrDefault(c => string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase));

                if (existing != null)
                {
                    customerCache[name] = existing.Id;
                }
                else
                {
                    var code = await GenerateUniqueCustomerCodeAsync(name, cancellationToken);
                    var customer = new Customer(code, name);
                    await _unitOfWork.Customers.AddAsync(customer, cancellationToken);
                    await _unitOfWork.SaveChangesAsync(cancellationToken); // salva para obter Id
                    customerCache[name] = customer.Id;
                    customersCreated++;
                }
            }

            // Fase 2: Processa produtos — mantém referência às entidades para obter IDs após SaveChanges
            var productsCreated = 0;
            var productsUpdated = 0;
            var rowData = new List<(Product Product, string CustomerName)>();

            foreach (var (description, customerName, reference) in rows)
            {
                var product = await _unitOfWork.Products.GetByReferenceAsync(reference, cancellationToken);
                if (product == null)
                {
                    var newProduct = new Product(reference, description, 1);
                    await _unitOfWork.Products.AddAsync(newProduct, cancellationToken);
                    rowData.Add((newProduct, customerName));
                    productsCreated++;
                }
                else
                {
                    if (product.Description != description)
                    {
                        product.Update(description, product.UnitsPerBox, product.UnitWeight, product.UnitPrice,
                            product.Barcode, product.Notes, product.DefaultPackagingId, product.BoxesPerPallet);
                        _unitOfWork.Products.Update(product);
                        productsUpdated++;
                    }
                    rowData.Add((product, customerName));
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken); // EF atualiza os IDs nas entidades

            // Fase 3: Cria vínculos cliente-produto
            var linksCreated = 0;
            foreach (var (product, customerName) in rowData)
            {
                if (string.IsNullOrEmpty(customerName)) continue;
                if (!customerCache.TryGetValue(customerName, out var customerId)) continue;

                var exists = await _unitOfWork.CustomerProducts.ExistsAsync(customerId, product.Id, cancellationToken);
                if (!exists)
                {
                    var link = new CustomerProduct(customerId, product.Id, product.Reference);
                    await _unitOfWork.CustomerProducts.AddAsync(link, cancellationToken);
                    linksCreated++;
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = $"{productsCreated} produtos criados, {productsUpdated} atualizados, {customersCreated} clientes criados, {linksCreated} vínculos criados",
                productsCreated,
                productsUpdated,
                customersCreated,
                linksCreated
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Erro ao processar: {ex.Message}" });
        }
    }

    // Importação completa — 1 linha de cabeçalho + colunas:
    // A=Descrição, B=Cliente, C=Referência, D=Un/Caixa, E=Cx/Pallet, F=Embalagem
    // Cria embalagens, clientes, produtos e vínculos de uma vez
    [HttpPost("import-master")]
    public async Task<IActionResult> ImportMaster(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Arquivo não enviado" });

        try
        {
            OfficeOpenXml.ExcelPackage.License.SetNonCommercialPersonal("LogiMaster");

            using var stream = file.OpenReadStream();
            using var package = new OfficeOpenXml.ExcelPackage(stream);
            var worksheet = package.Workbook.Worksheets[0];
            var rowCount = worksheet.Dimension?.Rows ?? 0;

            // Coleta linhas a partir da linha 2 (pula cabeçalho)
            // Colunas: A=Descrição, B=Cliente, C=Referência, D=Un/Cx, E=Cx/Pallet, F=Embalagem, G=Preço
            var rows = new List<(string Description, string CustomerName, string Reference, int UnitsPerBox, int? BoxesPerPallet, string PackagingCode, decimal? UnitPrice)>();
            for (int row = 2; row <= rowCount; row++)
            {
                var description = worksheet.Cells[row, 1].Text?.Trim();
                var customerName = worksheet.Cells[row, 2].Text?.Trim();
                var reference = worksheet.Cells[row, 3].Text?.Trim().ToUpper();
                var unitsPerBoxText = worksheet.Cells[row, 4].Text?.Trim();
                var boxesPerPalletText = worksheet.Cells[row, 5].Text?.Trim();
                var packagingCode = worksheet.Cells[row, 6].Text?.Trim().ToUpper().Replace(" ", "");
                var priceText = worksheet.Cells[row, 7].Text?.Trim();

                if (string.IsNullOrEmpty(reference)) continue;

                int.TryParse(unitsPerBoxText, out int unitsPerBox);
                if (unitsPerBox < 1) unitsPerBox = 1;

                int? boxesPerPallet = null;
                if (int.TryParse(boxesPerPalletText, out int bpp) && bpp > 0)
                    boxesPerPallet = bpp;

                // Parse de preço no formato brasileiro: "1,204" ou "1.204,50" ou "1204.50"
                decimal? unitPrice = null;
                if (!string.IsNullOrEmpty(priceText))
                {
                    // Remove pontos de milhar e substitui vírgula decimal por ponto
                    var normalized = priceText.Replace("R$", "").Replace(" ", "");
                    if (normalized.Contains(',') && normalized.Contains('.'))
                        normalized = normalized.Replace(".", "").Replace(",", ".");
                    else
                        normalized = normalized.Replace(",", ".");
                    if (decimal.TryParse(normalized, System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture, out var price) && price > 0)
                        unitPrice = price;
                }

                rows.Add((description ?? reference, customerName ?? "", reference, unitsPerBox, boxesPerPallet, packagingCode ?? "", unitPrice));
            }

            // Fase 1: Embalagens
            var packagingsCreated = 0;
            var packagingCache = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            foreach (var code in rows.Where(r => !string.IsNullOrEmpty(r.PackagingCode)).Select(r => r.PackagingCode).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var existing = await _unitOfWork.Packagings.GetByCodeAsync(code, cancellationToken);
                if (existing != null) { packagingCache[code] = existing.Id; continue; }

                // Detecta tipo pelo prefixo alfabético do código (ex: "KLT6421" → "KLT")
                var typePrefix = new string(code.TakeWhile(char.IsLetter).ToArray());
                if (string.IsNullOrEmpty(typePrefix)) typePrefix = code.Length > 3 ? code[..3] : code;

                var packType = await _context.PackagingTypes.FirstOrDefaultAsync(t => t.Code == typePrefix, cancellationToken);
                if (packType == null)
                {
                    packType = new PackagingType(typePrefix, typePrefix);
                    _context.PackagingTypes.Add(packType);
                    await _context.SaveChangesAsync(cancellationToken);
                }

                var newPkg = new Packaging(code, code, packType.Id);
                await _unitOfWork.Packagings.AddAsync(newPkg, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                packagingCache[code] = newPkg.Id;
                packagingsCreated++;
            }

            // Fase 2: Clientes
            var customersCreated = 0;
            var customerCache = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            foreach (var name in rows.Where(r => !string.IsNullOrEmpty(r.CustomerName)).Select(r => r.CustomerName).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var existing = (await _unitOfWork.Customers.SearchAsync(name, cancellationToken))
                    .FirstOrDefault(c => string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase));
                if (existing != null) { customerCache[name] = existing.Id; continue; }

                var code = await GenerateUniqueCustomerCodeAsync(name, cancellationToken);
                var customer = new Customer(code, name);
                await _unitOfWork.Customers.AddAsync(customer, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                customerCache[name] = customer.Id;
                customersCreated++;
            }

            // Fase 3: Produtos
            var productsCreated = 0;
            var productsUpdated = 0;
            var rowData = new List<(Product Product, string CustomerName)>();

            foreach (var (description, customerName, reference, unitsPerBox, boxesPerPallet, packagingCode, unitPrice) in rows)
            {
                int? packagingId = !string.IsNullOrEmpty(packagingCode) && packagingCache.TryGetValue(packagingCode, out var pid) ? pid : (int?)null;

                var product = await _unitOfWork.Products.GetByReferenceAsync(reference, cancellationToken);
                if (product == null)
                {
                    var newProduct = new Product(reference, description, unitsPerBox);
                    newProduct.Update(description, unitsPerBox, null, unitPrice, null, null, packagingId, boxesPerPallet);
                    await _unitOfWork.Products.AddAsync(newProduct, cancellationToken);
                    rowData.Add((newProduct, customerName));
                    productsCreated++;
                }
                else
                {
                    var finalPackagingId = packagingId ?? product.DefaultPackagingId;
                    var finalPrice = unitPrice ?? product.UnitPrice;
                    product.Update(description, unitsPerBox, product.UnitWeight, finalPrice,
                        product.Barcode, product.Notes, finalPackagingId, boxesPerPallet ?? product.BoxesPerPallet);
                    _unitOfWork.Products.Update(product);
                    rowData.Add((product, customerName));
                    productsUpdated++;
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Fase 4: Vínculos cliente-produto
            var linksCreated = 0;
            foreach (var (product, customerName) in rowData)
            {
                if (string.IsNullOrEmpty(customerName)) continue;
                if (!customerCache.TryGetValue(customerName, out var customerId)) continue;

                var exists = await _unitOfWork.CustomerProducts.ExistsAsync(customerId, product.Id, cancellationToken);
                if (!exists)
                {
                    await _unitOfWork.CustomerProducts.AddAsync(new CustomerProduct(customerId, product.Id, product.Reference), cancellationToken);
                    linksCreated++;
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = $"{productsCreated} produtos criados, {productsUpdated} atualizados, {customersCreated} clientes criados, {packagingsCreated} embalagens criadas, {linksCreated} vínculos criados",
                productsCreated,
                productsUpdated,
                customersCreated,
                packagingsCreated,
                linksCreated
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Erro ao processar: {ex.Message}" });
        }
    }

    private async Task<string> GenerateUniqueCustomerCodeAsync(string name, CancellationToken cancellationToken)
    {
        var sb = new System.Text.StringBuilder();
        foreach (var c in name.ToUpper())
        {
            if (char.IsLetterOrDigit(c)) sb.Append(c);
            if (sb.Length >= 8) break;
        }
        var baseCode = sb.Length > 0 ? sb.ToString() : "CLI";
        var code = baseCode;
        var counter = 1;
        while (await _unitOfWork.Customers.CodeExistsAsync(code, cancellationToken: cancellationToken))
        {
            var truncated = baseCode.Length > 5 ? baseCode[..5] : baseCode;
            code = $"{truncated}{counter:D3}";
            counter++;
        }
        return code;
    }

    // Novo endpoint - importa produtos e vínculos da planilha principal
    // Colunas: A=Referência, B=Un/Caixa, C=Embalagem (código), E=Cx/Pallet
    [HttpPost("import-spreadsheet")]
    public async Task<IActionResult> ImportFromSpreadsheet(IFormFile file, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Arquivo não enviado" });

        try
        {
            OfficeOpenXml.ExcelPackage.License.SetNonCommercialPersonal("LogiMaster");

            using var stream = file.OpenReadStream();
            using var package = new OfficeOpenXml.ExcelPackage(stream);
            var worksheet = package.Workbook.Worksheets[0];
            var rowCount = worksheet.Dimension?.Rows ?? 0;
            var created = 0;
            var updated = 0;
            var packagingNotFound = new List<string>();

            // Inicia da linha 2 para pular cabeçalho
            for (int row = 2; row <= rowCount; row++)
            {
                var reference = worksheet.Cells[row, 1].Text?.Trim().ToUpper();
                var unitsPerBoxText = worksheet.Cells[row, 2].Text?.Trim();
                var packagingText = worksheet.Cells[row, 3].Text?.Trim();
                var boxesPerPalletText = worksheet.Cells[row, 5].Text?.Trim();

                if (string.IsNullOrEmpty(reference)) continue;
                if (!int.TryParse(unitsPerBoxText, out int unitsPerBox) || unitsPerBox < 1) continue;

                int? boxesPerPallet = null;
                if (int.TryParse(boxesPerPalletText, out int bpp) && bpp > 0)
                    boxesPerPallet = bpp;

                // Busca embalagem pelo código (tenta com e sem espaços)
                int? packagingId = null;
                if (!string.IsNullOrEmpty(packagingText))
                {
                    var codeNoSpaces = packagingText.ToUpper().Replace(" ", "");
                    var codeWithSpaces = packagingText.ToUpper();

                    var packaging = await _unitOfWork.Packagings.GetByCodeAsync(codeNoSpaces, cancellationToken)
                                 ?? await _unitOfWork.Packagings.GetByCodeAsync(codeWithSpaces, cancellationToken);

                    if (packaging != null)
                        packagingId = packaging.Id;
                    else
                        packagingNotFound.Add(packagingText);
                }

                var product = await _unitOfWork.Products.GetByReferenceAsync(reference, cancellationToken);
                if (product == null)
                {
                    // Cria novo produto (descrição = referência por padrão)
                    product = new Product(reference, reference, unitsPerBox);
                    product.Update(reference, unitsPerBox, null, null, null, null, packagingId, boxesPerPallet);
                    await _unitOfWork.Products.AddAsync(product, cancellationToken);
                    created++;
                }
                else
                {
                    // Atualiza existente — mantém embalagem atual se não encontrou na planilha
                    var finalPackagingId = packagingId ?? product.DefaultPackagingId;
                    product.Update(product.Description, unitsPerBox, product.UnitWeight, product.UnitPrice,
                        product.Barcode, product.Notes, finalPackagingId, boxesPerPallet);
                    _unitOfWork.Products.Update(product);
                    updated++;
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = $"{created} criados, {updated} atualizados",
                created,
                updated,
                packagingNotFoundCount = packagingNotFound.Distinct().Count(),
                packagingNotFound = packagingNotFound.Distinct().Take(20).ToList()
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Erro ao processar: {ex.Message}" });
        }
    }
}
