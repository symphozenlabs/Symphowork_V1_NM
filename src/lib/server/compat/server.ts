export class NextResponse extends Response {
  static json(body: any, init?: ResponseInit): Response {
    return Response.json(body, init);
  }
}

export type NextRequest = Request;
