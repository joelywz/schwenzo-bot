import Cache from './Cache';

export default class CacheManager<T> {
  private caches: { [id: string]: Cache<T> } = {};

  getCache(id: string, callback: () => { t: T; duration: number }): T {
    for (const _id in this.caches) {
      if (id == _id) {
        return this.caches[id].retrieve();
      }
    }

    const { t, duration } = callback();
    return this.saveCache(id, t, duration);
  }

  saveCache(id: string, cacheObject: T, duration: number): T {
    const cache = this.caches[id];
    if (cache) this.removeCache(id);

    this.caches[id] = new Cache<T>(cacheObject);
    setTimeout(() => {
      this.removeCache(id);
    }, duration);

    return this.caches[id].retrieve();
  }

  removeCache(id: string) {
    delete this.caches[id];
  }
}
