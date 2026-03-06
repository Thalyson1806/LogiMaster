import { getAPI, postAPI } from "./api";
import { PackingListSummary, PackingList, DeliverRequest } from "../types";

export const deliveryService = {
  getForDelivery: () =>
    getAPI<PackingListSummary[]>("/packinglists/for-delivery"),

  getById: (id: number) =>
    getAPI<PackingList>(`/packinglists/${id}`),

  dispatch: (id: number, driverName: string) =>
    postAPI<PackingList>(`/packinglists/${id}/dispatch`, { driverName }),

  deliver: (id: number, data: DeliverRequest) =>
    postAPI<PackingList>(`/packinglists/${id}/deliver`, data),

  updateLocation: (id: number, data: { driverName: string; latitude: number; longitude: number }) =>
    postAPI<void>(`/packinglists/${id}/location`, data),
};
