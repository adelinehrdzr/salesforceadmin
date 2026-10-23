import json
import subprocess
import sys
import time
import unittest
import urllib.request
from pathlib import Path

class PracticeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.process=subprocess.Popen([sys.executable,'server.py','--port','8765'],cwd=Path(__file__).parent,stdout=subprocess.DEVNULL)
        for _ in range(50):
            try:
                urllib.request.urlopen('http://127.0.0.1:8765/api/questions'); break
            except OSError: time.sleep(.1)
        else: raise RuntimeError('Server did not start')
    @classmethod
    def tearDownClass(cls):
        cls.process.terminate();cls.process.wait(timeout=5)
    def get(self,path):
        return urllib.request.urlopen('http://127.0.0.1:8765'+path)
    def grade(self,body):
        return json.load(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8765/api/grade',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})))
    def test_bank_quality(self):
        bank=json.loads(Path(__file__).with_name('data').joinpath('questions.json').read_text())
        self.assertEqual(len(bank),60)
        self.assertEqual(len({q['prompt'] for q in bank}),60)
        for q in bank:
            self.assertEqual(len(set(q['choices'])),4)
            self.assertGreater(len(q['explanation']),70)
            self.assertTrue(q['reference'].startswith('https://trailhead.salesforce.com/'))
    def test_no_answer_leak_and_shuffled_options(self):
        runs=[json.load(self.get('/api/questions')) for _ in range(8)]
        for q in runs[0]:
            self.assertNotIn('explanation',q);self.assertNotIn('answer',q)
            self.assertEqual({c['id'] for c in q['choices']},{0,1,2,3})
        self.assertGreater(len({tuple(c['id'] for c in r[0]['choices']) for r in runs}),1)
    def test_grade_correct_incorrect_and_unanswered(self):
        r=self.grade({'ids':['ADM-001','ADM-002','ADM-003'],'answers':{'ADM-001':0,'ADM-002':2}})['results']
        self.assertEqual([x['correct'] for x in r],[True,False,False])
        self.assertTrue(all(x['explanation'] for x in r))
    def test_reject_duplicate_ids(self):
        with self.assertRaises(urllib.error.HTTPError) as e:
            self.grade({'ids':['ADM-001','ADM-001'],'answers':{}})
        self.assertEqual(e.exception.code,400)
    def test_full_bank_submission_and_assets(self):
        bank=json.load(self.get('/api/questions'))
        result=self.grade({'ids':[q['id'] for q in bank],'answers':{q['id']:0 for q in bank}})
        self.assertEqual(sum(r['correct'] for r in result['results']),60)
        for path in ['/','/app.js','/style.css']:
            self.assertEqual(self.get(path).status,200)

if __name__=='__main__':unittest.main()
