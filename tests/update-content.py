"""Import the approved text verbatim; not part of the delivered website runtime."""
import json, pathlib, re
source = pathlib.Path('C:/Users/Arthur/.codex/attachments/4c90ff50-77c5-4a25-b831-8f71e1646002/pasted-text.txt').read_text(encoding='utf-8')
data_file = pathlib.Path('js/content.js')
old = data_file.read_text(encoding='utf-8')
# The original JS object is serialized by Node before this script runs.
book = json.loads(pathlib.Path('tests/fixtures/content-v1.json').read_text(encoding='utf-8'))
for i, title in enumerate(['Cicatrizes','Sem perceber','Os olhos','Você já sabia','A gente','Nem todo capítulo termina como a gente queria'],1):
    heading = f'# {i:02d} — {title}'
    body = source.split(heading+'\n',1)[1].split('==================================================',1)[0].strip()
    page = book['pages'][i]
    page['paragraphs'] = body.split('\n\n')
    page.pop('note',None)
    page['title'] = title
body = source.split('# 07 — Ainda\n',1)[1].split('==================================================',1)[0].strip()
book['pages'][7]['paragraphs'] = body.split('\n\n')
book['pages'][7]['emphasis'] = book['pages'][7]['paragraphs'].index('eu ainda gosto de você.')
body = source.split('# Entre Dúvidas\n',1)[1].split('==================================================',1)[0].strip()
book['pages'].append({'label':'INTERLÚDIO','title':'Entre Dúvidas','theme':'interlude','effect':'poem','paragraphs':body.split('\n\n')})
body = source.split('Você disse uma vez que amaria se eu programasse alguma coisa para você.',1)[1].split('\n\nNo final:',1)[0]
body = 'Você disse uma vez que amaria se eu programasse alguma coisa para você.'+body
book['pages'][8]['paragraphs'] = body.strip().split('\n\n')
book['pages'][8].pop('note',None)
book['pages'][8]['clean'] = True
book['pages'][0]['note'] = book['pages'][0]['note'].replace('Obrigada','Obrigado')
book['branch']['yes'] = ['Calma.','Você está pulando uma parte da história.']
book['timings'].update({'eyes':6800,'eyesRevisit':4600,'eyesReduced':1100,'poemSpeed':30,'poemParagraph':430,'poemIsolate':2200,'choicePause':650})
book['ui']['readPoem'] = 'reler os versos'
data_file.write_text('/* Todos os textos aprovados e tempos de leitura vivem aqui. */\nwindow.BOOK = '+json.dumps(book,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
