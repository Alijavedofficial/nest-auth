export class ClassicResponseDTO {
  constructor(partial: Partial<ClassicResponseDTO>) {
    Object.assign(this, partial);
  }
  message: string;
  statusCode: number;
}
