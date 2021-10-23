export default class Cache<T> {
  private cache: T;

  constructor(cache: T) {
    this.cache = cache;
  }

  retrieve(): T {
    return this.cache;
  }
}
