export class BaseProvider {
  constructor(config) {
    this.config = config;
  }
  async compile({ system, user }) {
    throw new Error("compile() not implemented");
  }
}
