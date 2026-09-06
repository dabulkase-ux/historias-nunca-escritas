# Maduh

Um livro digital pessoal, escrito em HTML, CSS e JavaScript vanilla. Sem backend, instalação, fontes remotas, rastreamento ou dependências de produção.

## Abrir

Abra `index.html` diretamente no navegador. Para servir localmente, na pasta do projeto:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Acesse http://127.0.0.1:4173. Encerre o servidor com Ctrl+C.

## Arquivos

- `index.html`: estrutura semântica, controles de som e progresso.
- `css/style.css`: aparência aprovada da V1, preservada integralmente.
- `css/edition.css`: estilos exclusivos dos olhos, interlúdio e última página.
- `js/content.js`: todos os textos narrativos, opções, anotações e constantes de tempo em milissegundos.
- `js/app.js`: navegação, ramificações, sequência do epílogo e foco.
- `js/typewriter.js`: escrita reutilizável em lotes, cancelamento e revelação imediata.
- `js/animations.js`: integração dos olhos e correntes/cadeado existentes.
- `js/eyes.js`: partículas tipográficas em Canvas 2D, primeira visita e revisita.
- `js/audio.js`: cliques discretos por Web Audio API, criados somente após ativar o som.
- `assets/favicon.svg`: monograma original.
- `tests/`: testes de fluxo, interação, mobile, fidelidade dos textos, proteção do epílogo, comparação visual e performance. Capturas em `tests/screenshots`.

## Ajustar

Edite `BOOK.pages` em `js/content.js` para alterar os capítulos. `paragraphs` contém os parágrafos; `note` é a anotação manuscrita; `emphasis` indica o parágrafo destacado. A ordem em `app.js` inclui capa, dedicatória, 01–06, interlúdio sem número, 07, última página, epílogo e encerramento. O progresso é derivado dessa ordem. Os endereços numéricos da V1 foram mantidos; por isso o interlúdio está no fim do array de dados, mas é lido entre 06 e 07.

`BOOK.timings` concentra escrita rápida, dramática, backspace, pausas e duração dos efeitos. Os blocos reservam a altura final; o texto visível é atualizado em lotes, sem um elemento por letra durante a leitura. Um texto integral separado atende leitores de tela sem anunciar cada caractere.

Os olhos usam DOM Range para medir caracteres reais visíveis, uma vez por alteração de geometria. Um único canvas desenha 3.458 partículas no desktop ou 2.520 no mobile. Letras reais se misturam às partículas extras vindas das bordas. A anatomia, as cores, as densidades e as trajetórias aprovadas foram preservadas na otimização.

A primeira sequência dura 6,8 segundos: formação, pausa, piscada, abertura, pausa, dilatação, permanência e retorno. A revisita dura 4,6 segundos e começa com os olhos formados, olhando para os lados e revirando antes de devolver o texto. `eyesSequenceSeen` só se torna verdadeiro quando uma sequência termina sem cancelamento. Visitas incompletas não contam. Reiniciar limpa esse estado e a escolha do capítulo 04. Nenhum estado é persistido em disco.

Glifos são preparados em atlas e reutilizados com `drawImage`; as trajetórias fixas, tamanhos e trigonometria constante ficam em cache. Não há `measureText`, criação de caracteres, troca de fontes ou alocação de arrays no loop de desenho. A geometria interna só é recalculada quando a expressão muda. O DPR continua limitado a 2, com teto de 2,4 milhões de pixels. `OffscreenCanvas`/`ImageBitmap` são usados quando disponíveis, com fallback para canvas comum. Bitmaps locais, frames e listeners são liberados ao terminar ou sair.

No interlúdio, a escrita tem velocidade e pausas próprias; ao terminar, “Será?” fica isolado. “reler os versos” devolve o poema integral. O botão “Sim” apresenta a brincadeira e reabre a escolha, enquanto “Obviamente não” mantém correntes e cadeado. Nenhuma resposta altera o enredo.

## Interações

- Toque no texto ou no controle de revelação para terminar a digitação atual.
- Setas esquerda/direita: voltar/avançar; espaço: revelar/avançar. Quando o foco está num botão, seu comportamento nativo é preservado.
- Tab e Enter permitem percorrer e ativar os controles.
- O próximo capítulo aguarda a conclusão do efeito ou a escolha da resposta.
- Voltar à capa reinicia a escolha e a primeira experiência dos olhos. A leitura não é salva entre recargas.
- O som começa desligado; sua preferência permanece durante a leitura, inclusive ao reiniciar.
- O epílogo oculta toda a interface, incluindo som e navegação, até a conclusão. Escolha a preferência de áudio antes de entrar.

AbortController cancela esperas e cenas ao navegar. Um bloqueio de transição evita ações concorrentes. Texto vindo da configuração é inserido como texto, nunca como HTML.

## Hospedar depois

Publique `index.html`, `css/`, `js/` e `assets/` na raiz de qualquer hospedagem estática. Não há etapa de build.

- GitHub Pages: servir a pasta raiz da branch escolhida.
- Vercel: preset Other, sem comando de build, diretório de saída `.`.
- Outros hosts estáticos: enviar os quatro itens acima.

Nenhum commit, push ou deploy foi realizado. Não publique `tests/` se não quiser disponibilizar capturas da história.

## Verificação

Os testes usam Playwright como ferramenta de desenvolvimento opcional, não como dependência do livro. A variável `PLAYWRIGHT_MODULE` permite apontar para uma instalação externa. Com o servidor ativo:

```sh
node tests/content-approved.cjs
node tests/epilogue-frozen.cjs
node tests/browser.cjs
node tests/interaction.cjs
node tests/mobile.cjs
node tests/eyes-visual.cjs
node tests/eyes-performance.cjs
```

Os testes mobile requerem os navegadores Chromium e WebKit do Playwright. A comparação visual usa também `pngjs` instalado junto ao Playwright. Execute performance isoladamente para evitar disputa por recursos. `capture-v1.cjs` e `update-content.py` são registros de importação inicial, não testes; não os execute para validar ou atualizar a V2.

Os resultados e limitações da validação estão em `tests/RESULTS.md`. A comparação do epílogo usa o registro imutável `tests/fixtures/epilogue-v1.json`: função, CSS original, áudio, primitiva de espera, textos e tempos. O teste de navegador também compara a captura do epílogo com e sem a folha V2 para detectar efeitos visuais indiretos.

Revisar manualmente antes de entregar: volume em fones, leitura no Safari de um iPhone real e no Chrome de um Android, tamanho preferido da fonte e ritmo emocional do epílogo. As fontes são locais: Georgia e Segoe Print/Bradley Hand com alternativas, portanto a caligrafia pode variar conforme o aparelho.

“Obrigado por existir nesse enredo.” foi corrigido conforme solicitado. Os novos capítulos, o poema e a última página foram conferidos literalmente contra os textos aprovados.
