export interface StoreEvent<T = unknown> {
  type: string;
  payload?: T;
}
