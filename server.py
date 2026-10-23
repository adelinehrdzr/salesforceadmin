"""Local, dependency-free certification practice server."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import json
import random

ROOT = Path(__file__).parent
BANK = json.loads((ROOT / 'data/questions.json').read_text())
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT / 'static'), **kwargs)
    def do_GET(self):
        if self.path == '/api/questions':
            # Deliberately exclude answers from the initial question payload.
            questions = []
            for q in BANK:
                choices = list(enumerate(q['choices']))
                random.SystemRandom().shuffle(choices)
                questions.append({k:q[k] for k in ('id','topic','prompt')} | {'choices':[{'id':i,'text':s} for i,s in choices]})
            payload = json.dumps(questions).encode()
            self.send_response(200); self.send_header('Content-Type','application/json'); self.send_header('Cache-Control','no-store'); self.end_headers(); self.wfile.write(payload)
        else:
            super().do_GET()
    def do_POST(self):
        if self.path != '/api/grade':
            self.send_error(404); return
        try:
            size = int(self.headers.get('Content-Length',0))
            if not 0 < size <= 100000: raise ValueError('Invalid payload size')
            body = json.loads(self.rfile.read(size))
            ids = body['ids']; answers = body['answers']
            lookup = {q['id']: q for q in BANK}
            if not isinstance(ids,list) or len(ids) != len(set(ids)) or not ids or any(i not in lookup for i in ids): raise ValueError('Invalid question selection')
            results = []
            for i in ids:
                q=lookup[i]; selected=answers.get(i)
                results.append({'id':i,'topic':q['topic'],'correct':selected==0,'answer':0,'explanation':q['explanation'],'reference':q['reference']})
            payload=json.dumps({'results':results}).encode()
        except (ValueError,KeyError,TypeError):
            self.send_error(400,'Invalid submission'); return
        self.send_response(200); self.send_header('Content-Type','application/json'); self.end_headers(); self.wfile.write(payload)

if __name__ == '__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--port',type=int,default=8000); args=parser.parse_args()
    print(f'Admin Practice Lab: http://127.0.0.1:{args.port}',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
