export interface StoreEvent<T extends string = string, P = unknown> {
  type: T;
  payload?: P;
}
