export class ReportGenerationError extends Error {
  constructor(cause?: unknown) {
    super('Não foi possível gerar o arquivo do relatório.', { cause });
    this.name = new.target.name;
  }
}
