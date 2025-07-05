/*jslint browser */

document.addEventListener('DOMContentLoaded', function () {
   'use strict';

   const niya = (function () {
      const util = {
         createGame: function (oldGame) {
            const boardSize = 4;
            const consonants = 'dgvz';
            const vowels = 'eiou';
            const newGame = {
               board: (function () {
                  let tiles;
                  tiles = Array.from(
                     {length: boardSize * boardSize},
                     (ignore, whichTile) => (
                        consonants.charAt(whichTile / boardSize)
                        + vowels.charAt(whichTile % boardSize)
                     )
                  );
                  return Array.from(
                     {length: boardSize},
                     () => Array.from(
                        {length: boardSize},
                        function () {
                           const whichTile = Math.floor(Math.random() * tiles.length);
                           const tile = tiles[whichTile];
                           tiles = [
                              ...tiles.slice(0, whichTile),
                              ...tiles.slice(whichTile + 1)
                           ];
                           return tile;
                        }
                     )
                  );
               }()),
               lastTile: 0,
               nextPlayer: 1
            };
            oldGame = (function deepCopy(oldThing) {
               return (
                  Array.isArray(oldThing)
                  ? oldThing.map(deepCopy)
                  : typeof oldThing === 'object'
                  ? Object.keys(oldThing).reduce(
                     function (newObject, prop) {
                        newObject[prop] = deepCopy(oldThing[prop]);
                        return newObject;
                     },
                     {}
                  )
                  : oldThing
               );
            }(oldGame));
            return (
               typeof oldGame === 'object'
               ? Object.keys(newGame).reduce(
                  function (newObject, prop) {
                     newObject[prop] = (
                        Object.hasOwn(oldGame, prop)
                        ? oldGame[prop]
                        : newGame[prop]
                     );
                     return newObject;
                  },
                  {}
               )
               : newGame
            );
         },
         deepFreeze: function deepFreeze(oldThing) {
            return (
               Array.isArray(oldThing)
               ? Object.freeze(oldThing.map(
                  (currentValue) => deepFreeze(currentValue)
               ))
               : typeof oldThing === 'object'
               ? Object.freeze(Object.keys(oldThing).reduce(
                  function (newObject, prop) {
                     newObject[prop] = deepFreeze(oldThing[prop]);
                     return newObject;
                  },
                  {}
               ))
               : oldThing
            );
         },
         wouldBeLegalMove: (game, moveToMake) => (
            (
               typeof moveToMake !== 'object'
               || !Array.isArray(game.board[moveToMake.row])
               || typeof game.board[moveToMake.row][moveToMake.column] !== 'string'
            )
            ? false
            : typeof game.lastTile !== 'string'
            ? (
               moveToMake.row === 0
               || moveToMake.row === game.board.length - 1
               || moveToMake.column === 0
               || moveToMake.column === game.board[0].length - 1
            )
            : (
               game.board[moveToMake.row][moveToMake.column].charAt(0) === game.lastTile.charAt(0)
               || game.board[moveToMake.row][moveToMake.column].charAt(1) === game.lastTile.charAt(1)
            )
         )
      };

      const self = {
         createGame: (oldGame) => util.deepFreeze(util.createGame(oldGame)),
         hasPlayerWon: function (game, player) {
            // row:
            if (game.board.some(
               (row) => row.every(
                  (space) => space === player
               )
            )) {
               return true;
            }
            // column:
            if (game.board.reduce(
               (columnWonSoFar, row) => row.map(
                  (space, whichColumn) => (
                     columnWonSoFar[whichColumn] === space
                     ? space
                     : 0
                  )
               )
            ).some(
               (columnWon) => columnWon === player
            )) {
               return true;
            }
            // column (another way):
            if (game.board.reduce(
               (columnWonSoFar, row) => row.map(
                  (space, whichColumn) => columnWonSoFar[whichColumn] && space === player
               ),
               game.board[0].map(() => true)
            ).some(
               (columnWon) => columnWon
            )) {
               return true;
            }
            // column (another way):
            if (game.board[0].some(
               (space, whichColumn) => game.board.every(
                  (row) => row.some(
                     (spaceNow, whichColumnNow) => whichColumn === whichColumnNow && space === player && spaceNow === player
                  )
               )
            )) {
               return true;
            }
            // diagonals:
            if (game.board.map(
               (row, whichRow) => row[whichRow]
            ).every(
               (space) => space === player
            )) {
               return true;
            }
            if (game.board.map(
               (row, whichRow) => row[row.length - whichRow - 1]
            ).every(
               (space) => space === player
            )) {
               return true;
            }
            // 2x2 squares:
            if (game.board.some(
               (row, whichRow) => row.some(
                  (space, whichColumn) => (
                     space === player
                     && row[whichColumn + 1] === player
                     && game.board[whichRow + 1]
                     && game.board[whichRow + 1][whichColumn] === player
                     && game.board[whichRow + 1][whichColumn + 1] === player
                  )
               )
            )) {
               return true;
            }
            // opponent trapped:
            if (
               game.nextPlayer !== player
               && self.numAvailableSpaces(game) > 0
               && !game.board.some(
                  (row, whichRow) => row.some(
                     (ignore, whichColumn) => util.wouldBeLegalMove(
                        game,
                        {
                           row: whichRow,
                           column: whichColumn
                        }
                     )
                  )
               )
            ) {
               return true;
            }
            return false;
         },
         isGameDrawn: (game) => (
            self.numAvailableSpaces(game) === 0
            && !self.hasPlayerWon(game, 1)
            && !self.hasPlayerWon(game, 2)
         ),
         isGameOver: (game) => (
            self.hasPlayerWon(game, 1)
            || self.hasPlayerWon(game, 2)
            || self.numAvailableSpaces(game) === 0
         ),
         isLegalMove: (game, moveToMake) => (
            !self.isGameOver(game)
            && util.wouldBeLegalMove(game, moveToMake)
         ),
         makeMove: function (oldGame, moveToMake) {
            if (!self.isLegalMove(oldGame, moveToMake)) {
               return oldGame;
            }
            const newGame = util.createGame(oldGame);
            newGame.lastTile = newGame.board[moveToMake.row][moveToMake.column];
            newGame.board[moveToMake.row][moveToMake.column] = newGame.nextPlayer;
            newGame.nextPlayer = (
               newGame.nextPlayer === 1
               ? 2
               : 1
            );
            return util.deepFreeze(newGame);
         },
         makeRandomMove: function (game) {
            if (self.isGameOver(game)) {
               return game;
            }
            let moveToMake;
            do {
               moveToMake = {
                  row: Math.floor(Math.random() * game.board.length),
                  column: Math.floor(Math.random() * game.board[0].length)
               };
            } while (!self.isLegalMove(game, moveToMake));
            return self.makeMove(game, moveToMake);
         },
         makeSmartMove: function (game, depth) {
            if (self.isGameOver(game)) {
               return game;
            }
            if (depth <= 0) {
               return game;
            }
            const moveToMake = (function (bestMoves) {
               return bestMoves.moves[Math.floor(Math.random() * bestMoves.moves.length)];
            }(
               // FIXME {value: v, moves: [{row: r1, column: c1}, {row: r2, column: c2}]}
               // reduce, etc.
            ));
            return self.makeMove(game, moveToMake);
         },
         numAvailableSpaces: (game) => game.board.reduce(
            (matrixSumSoFar, row) => row.reduce(
               (rowSumSoFar, space) => rowSumSoFar + (
                  typeof space === 'string'
                  ? 1
                  : 0
               ),
               matrixSumSoFar
            ),
            0
         ),
         numMovesMade: (game) => game.board.reduce(
            (matrixSumSoFar, row) => row.reduce(
               (rowSumSoFar, space) => rowSumSoFar + (
                  typeof space === 'string'
                  ? 0
                  : 1
               ),
               matrixSumSoFar
            ),
            0
         ),
         valueToPlayer: function (game, player, depth) {
            let bestValue;
            if (self.hasPlayerWon(game, player)) {
               return (self.numAvailableSpaces(game) + 1) * 1000;
            }
            if (self.hasPlayerWon(
               game,
               (
                  player === 1
                  ? 2
                  : 1
               )
            )) {
               return -(self.numAvailableSpaces(game) + 1) * 1000;
            }
            if (self.isGameDrawn(game)) {
               return 0;
            }
            if (depth <= 0) {
               bestValue = 0;
               // rows
               game.board.forEach(function (row) {
                  bestValue += (function (counts) {
                     return counts[0] - counts[1];
                  }(
                     row.reduce(
                        (valueSoFar, space) => (
                           typeof space === 'string'
                           ? valueSoFar
                           : space === player
                           ? [valueSoFar[0] * 5, 0]
                           : [0, valueSoFar[1] * 5]
                        ),
                        [1, 1]
                     )
                  ));
               });
               // FIXME also do columns, diagonals, 2x2 squares
               return bestValue;
            }
            bestValue = (
               game.nextPlayer === player
               ? Number.NEGATIVE_INFINITY
               : Number.POSITIVE_INFINITY
            );
            game.board.forEach(function (row, whichRow) {
               row.forEach(function (ignore, whichColumn) {
                  const newValue = self.valueToPlayer(
                     self.makeMove(
                        game,
                        {
                           row: whichRow,
                           column: whichColumn
                        }
                     ),
                     player,
                     depth - 1
                  );
                  if (
                     game.nextPlayer === player
                     ? newValue > bestValue
                     : newValue < bestValue
                  ) {
                     bestValue = newValue;
                  }
               });
            });
            return bestValue;
         }
      };
      return Object.freeze(self);
   }());

   (function () {
      let niyaGame;

      const updateNiyaGame = function () {
         localStorage.setItem('Niya', JSON.stringify(niyaGame));

         const gameboardElement = document.querySelector('#gameboard');
         [...gameboardElement.childNodes].forEach(function (childNode) {
            childNode.remove();
         });
         niyaGame.board.forEach(function (row, whichRow) {
            const rowElement = document.createElement('div');
            rowElement.classList.add('row');
            row.forEach(function (space, whichColumn) {
               const spaceElement = document.createElement('div');
               spaceElement.classList.add('space');
               spaceElement.textContent = space;
               if (typeof space === 'string') {
                  spaceElement.classList.add(space.charAt(0));
                  spaceElement.classList.add(space.charAt(1));
               } else if (typeof space === 'number') {
                  spaceElement.classList.add('token');
                  spaceElement.classList.add('player' + space);
               }
               if (niya.isLegalMove(
                  niyaGame,
                  {
                     row: whichRow,
                     column: whichColumn
                  }
               )) {
                  spaceElement.classList.add('legal-move');
               }
               rowElement.appendChild(spaceElement);
            });
            gameboardElement.appendChild(rowElement);
         });

         [...gameboardElement.querySelectorAll('.row')].forEach(function (rowElement, whichRow) {
            [...rowElement.querySelectorAll('.space')].forEach(function (spaceElement, whichColumn) {
               spaceElement.addEventListener('click', function () {
                  niyaGame = niya.makeMove(
                     niyaGame,
                     {
                        row: whichRow,
                        column: whichColumn
                     }
                  );
                  while (
                     !niya.isGameOver(niyaGame)
                     && document.querySelector('#ai-player' + niyaGame.nextPlayer).checked
                  ) {
                     niyaGame = niya.makeRandomMove(niyaGame);
                  }
                  updateNiyaGame();
               });
            });
         });

         document.querySelector('#next-player-area').style.visibility = (
            niya.isGameOver(niyaGame)
            ? 'hidden'
            : 'visible'
         );
         const nextPlayerElement = document.querySelector('#next-player');
         [...nextPlayerElement.childNodes].forEach(function (childNode) {
            childNode.remove();
         });
         const nextPlayerDiv = document.createElement('div');
         nextPlayerDiv.textContent = niyaGame.nextPlayer;
         nextPlayerDiv.classList.add('space');
         nextPlayerDiv.classList.add('token');
         nextPlayerDiv.classList.add('player' + niyaGame.nextPlayer);
         nextPlayerElement.appendChild(nextPlayerDiv);

         document.querySelector('#last-tile-area').style.visibility = (
            niya.numMovesMade(niyaGame) > 0
            ? 'visible'
            : 'hidden'
         );
         const lastTileElement = document.querySelector('#last-tile');
         [...lastTileElement.childNodes].forEach(function (childNode) {
            childNode.remove();
         });
         const lastTileDiv = document.createElement('div');
         lastTileDiv.classList.add('space');
         lastTileDiv.textContent = niyaGame.lastTile;
         if (typeof niyaGame.lastTile === 'string') {
            lastTileDiv.classList.add(niyaGame.lastTile.charAt(0));
            lastTileDiv.classList.add(niyaGame.lastTile.charAt(1));
         }
         lastTileElement.appendChild(lastTileDiv);

         document.querySelector('#result-area').style.visibility = (
            niya.isGameOver(niyaGame)
            ? 'visible'
            : 'hidden'
         );
         const resultElement = document.querySelector('#result');
         [...resultElement.childNodes].forEach(function (childNode) {
            childNode.remove();
         });
         const resultDiv = document.createElement('div');
         resultDiv.classList.add('space');
         resultDiv.classList.add('token');
         if (niya.hasPlayerWon(niyaGame, 1)) {
            resultDiv.textContent = 1;
            resultDiv.classList.add('player1');
         } else if (niya.hasPlayerWon(niyaGame, 2)) {
            resultDiv.textContent = 2;
            resultDiv.classList.add('player2');
         } else if (niya.isGameDrawn(niyaGame)) {
            resultDiv.textContent = 'draw';
         }
         resultElement.appendChild(resultDiv);
      };

      document.querySelector('#start-new-game').addEventListener('click', function () {
         niyaGame = niya.createGame();
         while (
            !niya.isGameOver(niyaGame)
            && document.querySelector('#ai-player' + niyaGame.nextPlayer).checked
         ) {
            niyaGame = niya.makeRandomMove(niyaGame);
         }
         updateNiyaGame();
      });

      document.querySelector('#eval-moves').addEventListener('click', function () {
         setTimeout(
            function () {
               document.querySelector('#debug-output').value = niyaGame.board.map(
                  (row, whichRow) => row.map(
                     (ignore, whichColumn) => (
                        niya.isLegalMove(
                           niyaGame,
                           {
                              row: whichRow,
                              column: whichColumn
                           }
                        )
                        ? niya.valueToPlayer(
                           niya.makeMove(
                              niyaGame,
                              {
                                 row: whichRow,
                                 column: whichColumn
                              }
                           ),
                           1,
                           3
                        )
                        : '.'
                     )
                  ).join(' ')
               ).join('\n');
            },
            0
         );
      });

      document.querySelector('#sim-random').addEventListener('click', function () {
         let w1 = 0;
         let w2 = 0;
         let d = 0;
         let moreTimes = 100000;
         (function keepIterating() {
            let game = niya.createGame();
            while (!niya.isGameOver(game)) {
               game = niya.makeRandomMove(game);
            }
            if (niya.hasPlayerWon(game, 1)) {
               w1 += 1;
            }
            if (niya.hasPlayerWon(game, 2)) {
               w2 += 1;
            }
            if (niya.isGameDrawn(game)) {
               d += 1;
            }
            document.querySelector('#debug-output').value = (
               'P1: ' + w1 + ' (' + (100 * w1 / (w1 + w2 + d)).toFixed(2) + '%)\n'
               + 'P2: ' + w2 + ' (' + (100 * w2 / (w1 + w2 + d)).toFixed(2) + '%)\n'
               + ' D: ' + d + ' (' + (100 * d / (w1 + w2 + d)).toFixed(2) + '%)\n'
            );
            moreTimes -= 1;
            if (moreTimes > 0) {
               document.querySelector('#debug-output').value += moreTimes + ' games to go . . .';
               setTimeout(keepIterating, 0);
            } else {
               document.querySelector('#debug-output').value += 'Done!';
            }
         }());
      });

      try {
         niyaGame = niya.createGame(JSON.parse(localStorage.getItem('Niya')));
      } catch (ignore) {
         niyaGame = niya.createGame();
      }
      updateNiyaGame();
   }());
});
