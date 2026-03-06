import { getAPI, postAPI } from "./api";
import { PackingList, PackingListSummary } from "../types";

export const packingListService = {
  // Lista TODOS os romaneios pendentes (para expedição)
  getAll: () =>
    getAPI<PackingListSummary[]>("/packinglists").then((lists) =>
      lists.filter(
        (pl) =>
          pl.status !== "Invoiced" &&
          pl.status !== "Cancelled"
      )
    ),

  // Busca romaneio por ID
  getById: (id: number) => getAPI<PackingList>(`/packinglists/${id}`),

  // Busca romaneio por código
  getByCode: (code: string) => getAPI<PackingList>(`/packinglists/code/${code}`),

  // SEPARAÇÃO
  startSeparation: (id: number) =>
    postAPI<PackingList>(`/packinglists/${id}/start-separation`, {}),

  completeSeparation: (id: number) =>
    postAPI<PackingList>(`/packinglists/${id}/complete-separation`, {}),

  // CONFERÊNCIA
  startConference: (id: number) =>
    postAPI<PackingList>(`/packinglists/${id}/start-conference`, {}),

  conferenceItem: (id: number, itemId: number) =>
    postAPI<PackingList>(`/packinglists/${id}/conference-item`, { itemId }),

  completeConference: (id: number) =>
    postAPI<PackingList>(`/packinglists/${id}/complete-conference`, {}),
};
