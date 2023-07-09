import {Request, Response} from 'express';

export class Basic {
  public static async chat(body: Request['body'], res: Response) {
    console.log(body);
    // sends response back to Deep Chat using the Result format:
    // https://deepchat.dev/docs/connect/#Result
    res.json({result: {text: 'This is a respone from ExpressJs server. Thankyou for your message!'}});
  }

  public static async chatStream(body: Request['body'], res: Response) {
    console.log(body);
    const responseChunks = 'This is a respone from ExpressJs server. Thankyou for your message!'.split(' ');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    Basic.sendStream(res, responseChunks);
  }

  private static sendStream(res: Response, responseChunks: string[], chunkIndex = 0) {
    setTimeout(() => {
      const chunk = responseChunks[chunkIndex];
      if (chunk) {
        // sends response back to Deep Chat using the Result format:
        // https://deepchat.dev/docs/connect/#Result
        res.write(`data: ${JSON.stringify({result: {text: `${chunk} `}})}\n\n`);
        Basic.sendStream(res, responseChunks, chunkIndex + 1);
      } else {
        res.end();
      }
    }, 70);
  }

  public static async files(req: Request, res: Response) {
    // files are stored inside req.files
    if (req.files as Express.Multer.File[]) {
      console.log('Files:');
      console.log(req.files);
    }
    // text messages are stored inside req.body
    if (Object.keys(req.body).length > 0) {
      console.log('Text messages:');
      console.log(req.body);
    }
    // sends response back to Deep Chat using the Result format:
    // https://deepchat.dev/docs/connect/#Result
    res.json({result: {text: 'This is a respone from ExpressJs server. Thankyou for your message!'}});
  }
}
