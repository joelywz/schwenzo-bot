export default class SchwenzoError extends Error {
  type: number;
  message: string;

  constructor(type: number, message: string) {
    super();
    this.type = type;
    this.message = message;
  }
}
