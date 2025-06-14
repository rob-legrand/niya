/*jslint browser: true, indent: 3 */

document.addEventListener('DOMContentLoaded', function () {
   'use strict';
   var niya;

   niya = (function () {
      var deepCopy, self, util;

      deepCopy = function deepCopy(oldThing) {
         if (Array.isArray(oldThing)) {
            return oldThing.map(function (currentValue) {
               return deepCopy(currentValue);
            });
         }
         if (typeof oldThing === 'object') {
            return Object.keys(oldThing).reduce(function (newObject, prop) {
               newObject[prop] = deepCopy(oldThing[prop]);
               return newObject;
            }, {});
         }
         return oldThing;
      };

      util = {
         createGame: function (oldGame) {
            var boardRow, boardSize, cards, newGame, whichCard;
            boardSize = 4;
            cards = [];
            while (cards.length < boardSize * boardSize) {
               cards.push(String.fromCharCode('a'.charCodeAt(0) + cards.length / boardSize, 'a'.charCodeAt(0) + boardSize + cards.length % boardSize));
            }
            newGame = {
               board: [],
               lastCard: 0,
               nextPlayer: 1
            };
            while (newGame.board.length < boardSize) {
               boardRow = [];
               while (boardRow.length < boardSize) {
                  whichCard = Math.floor(Math.random() * cards.length);
                  boardRow.push(cards[whichCard]);
                  cards = cards.slice(0, whichCard).concat(cards.slice(whichCard + 1));
               }
               newGame.board.push(boardRow);
            }
            oldGame = (function deepCopy(oldThing) {
               if (Array.isArray(oldThing)) {
                  return oldThing.map(function (currentValue) {
                     return deepCopy(currentValue);
                  });
               }
               if (typeof oldThing === 'object') {
                  return Object.keys(oldThing).reduce(function (newObject, prop) {
                     newObject[prop] = deepCopy(oldThing[prop]);
                     return newObject;
                  }, {});
               }
               return oldThing;
            }(oldGame));
            if (typeof oldGame === 'object') {
               newGame = Object.keys(newGame).reduce(function (newObject, prop) {
                  newObject[prop] = oldGame.hasOwnProperty(prop) ? oldGame[prop] : newGame[prop];
                  return newObject;
               }, {});
            }
            return newGame;
         },
         deepFreeze: function deepFreeze(oldThing) {
            if (Array.isArray(oldThing)) {
               return Object.freeze(oldThing.map(function (currentValue) {
                  return deepFreeze(currentValue);
               }));
            }
            if (typeof oldThing === 'object') {
               return Object.freeze(Object.keys(oldThing).reduce(function (newObject, prop) {
                  newObject[prop] = deepFreeze(oldThing[prop]);
                  return newObject;
               }, {}));
            }
            return oldThing;
         },
         wouldBeLegalMove: function (game, moveToMake) {
            if (typeof moveToMake !== 'object' || !Array.isArray(game.board[moveToMake.row]) || typeof game.board[moveToMake.row][moveToMake.column] !== 'string') {
               return false;
            }
            if (typeof game.lastCard !== 'string') {
               return moveToMake.row === 0 || moveToMake.row === game.board.length - 1 || moveToMake.column === 0 || moveToMake.column === game.board[0].length - 1;
            }
            return game.board[moveToMake.row][moveToMake.column].charAt(0) === game.lastCard.charAt(0) || game.board[moveToMake.row][moveToMake.column].charAt(1) === game.lastCard.charAt(1);
         }
      };

      self = {
         createGame: function (oldGame) {
            return util.deepFreeze(util.createGame(oldGame));
         },
         hasPlayerWon: function (game, player) {
            // row:
            if (game.board.some(function (row) {
                  return row.every(function (space) {
                     return space === player;
                  });
               })) {
               return true;
            }
            // column:
            if (game.board.reduce(function (columnWonSoFar, row) {
                  return row.map(function (space, whichColumn) {
                     return columnWonSoFar[whichColumn] === space ? space : 0;
                  });
               }).some(function (columnWon) {
                  return columnWon === player;
               })) {
               return true;
            }
            // column (another way):
            if (game.board.reduce(function (columnWonSoFar, row) {
                  return row.map(function (space, whichColumn) {
                     return columnWonSoFar[whichColumn] && space === player;
                  });
               }, game.board[0].map(function () {
                  return true;
               })).some(function (columnWon) {
                  return columnWon;
               })) {
               return true;
            }
            // column (another way):
            if (game.board[0].some(function (space, whichColumn) {
                  return game.board.every(function (row) {
                     return row.some(function (spaceNow, whichColumnNow) {
                        return whichColumn === whichColumnNow && space === player && spaceNow === player;
                     });
                  });
               })) {
               return true;
            }
            // diagonals:
            if (game.board.map(function (row, whichRow) {
                  return row[whichRow];
               }).every(function (space) {
                  return space === player;
               })) {
               return true;
            }
            if (game.board.map(function (row, whichRow) {
                  return row[row.length - whichRow - 1];
               }).every(function (space) {
                  return space === player;
               })) {
               return true;
            }
            // 2x2 squares:
            if (game.board.some(function (row, whichRow) {
                  return row.some(function (space, whichColumn) {
                     return space === player && row[whichColumn + 1] === player && game.board[whichRow + 1] && game.board[whichRow + 1][whichColumn] === player && game.board[whichRow + 1][whichColumn + 1] === player;
                  });
               })) {
               return true;
            }
            // opponent trapped:
            if (game.nextPlayer !== player && self.numAvailableSpaces(game) > 0 && !game.board.some(function (row, whichRow) {
                  return row.some(function (ignore, whichColumn) {
                     return util.wouldBeLegalMove(game, {
                        row: whichRow,
                        column: whichColumn
                     });
                  });
               })) {
               return true;
            }
            return false;
         },
         isGameDrawn: function (game) {
            return self.numAvailableSpaces(game) === 0 && !self.hasPlayerWon(game, 1) && !self.hasPlayerWon(game, 2);
         },
         isGameOver: function (game) {
            return self.hasPlayerWon(game, 1) || self.hasPlayerWon(game, 2) || self.numAvailableSpaces(game) === 0;
         },
         isLegalMove: function (game, moveToMake) {
            return !self.isGameOver(game) && util.wouldBeLegalMove(game, moveToMake);
         },
         makeMove: function (oldGame, moveToMake) {
            var newGame;
            if (!self.isLegalMove(oldGame, moveToMake)) {
               return oldGame;
            }
            newGame = util.createGame(oldGame);
            newGame.lastCard = newGame.board[moveToMake.row][moveToMake.column];
            newGame.board[moveToMake.row][moveToMake.column] = newGame.nextPlayer;
            newGame.nextPlayer = newGame.nextPlayer === 1 ? 2 : 1;
            return util.deepFreeze(newGame);
         },
         makeRandomMove: function (game) {
            var moveToMake;
            if (self.isGameOver(game)) {
               return game;
            }
            do {
               moveToMake = {
                  row: Math.floor(Math.random() * game.board.length),
                  column: Math.floor(Math.random() * game.board[0].length)
               };
            } while (!self.isLegalMove(game, moveToMake));
            return self.makeMove(game, moveToMake);
         },
         makeSmartMove: function (game, depth) {
            var moveToMake;
            if (self.isGameOver(game)) {
               return game;
            }
            moveToMake = (function (bestMoves) {
               return bestMoves.moves[Math.floor(Math.random() * bestMoves.moves.length)];
            }(
               // FIXME {value: v, moves: [{row: r1, column: c1}, {row: r2, column: c2}]}
               // reduce, etc.
            ));
            return self.makeMove(game, moveToMake);
         },
         numAvailableSpaces: function (game) {
            return game.board.reduce(function (matrixSumSoFar, row) {
               return row.reduce(function (rowSumSoFar, space) {
                  return rowSumSoFar + (typeof space === 'string' ? 1 : 0);
               }, matrixSumSoFar);
            }, 0);
         },
         numMovesMade: function (game) {
            return game.board.reduce(function (matrixSumSoFar, row) {
               return row.reduce(function (rowSumSoFar, space) {
                  return rowSumSoFar + (typeof space === 'string' ? 0 : 1);
               }, matrixSumSoFar);
            }, 0);
         },
         valueToPlayer: function (game, player, depth) {
            var bestValue;
            if (self.hasPlayerWon(game, player)) {
               return (self.numAvailableSpaces(game) + 1) * 1000;
            }
            if (self.hasPlayerWon(game, player === 1 ? 2 : 1)) {
               return -(self.numAvailableSpaces(game) + 1) * 1000;
            }
            if (self.isGameDrawn(game)) {
               return 0;
            }
            if (depth <= 0) {
               bestValue = 0;
               // rows
               game.board.forEach(function (row, whichRow) {
                  bestValue += (function (counts) {
                     return counts[0] - counts[1];
                  }(row.reduce(function (valueSoFar, space, whichColumn) {
                     return typeof space === 'string' ? valueSoFar : space === player ? [valueSoFar[0] * 5, 0] : [0, valueSoFar[1] * 5];
                  }, [1, 1])));
               });
               // FIXME also do columns, diagonals, 2x2 squares
               return bestValue;
            }
            bestValue = game.nextPlayer === player ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
            game.board.forEach(function (row, whichRow) {
               row.forEach(function (space, whichColumn) {
                  var newValue;
                  newValue = self.valueToPlayer(self.makeMove(game, {
                     row: whichRow,
                     column: whichColumn
                  }), player, depth - 1);
                  if (game.nextPlayer === player ? newValue > bestValue : newValue < bestValue) {
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
      var niyaGame, updateNiyaGame;

      updateNiyaGame = function () {
         var gameboardElement, lastCardElement, nextPlayerElement, resultElement;

         if (localStorage && localStorage.setItem) {
            localStorage.setItem('Niya', JSON.stringify(niyaGame));
         }

         gameboardElement = document.querySelector('#gameboard');
         while (gameboardElement.hasChildNodes()) {
            gameboardElement.removeChild(gameboardElement.lastChild);
         }
         niyaGame.board.forEach(function (row, whichRow) {
            var rowElement;
            rowElement = document.createElement('div');
            rowElement.classList.add('row');
            row.forEach(function (space, whichColumn) {
               var spaceElement;
               spaceElement = document.createElement('div');
               spaceElement.classList.add('space');
               spaceElement.textContent = space;
               if (typeof space === 'string') {
                  spaceElement.classList.add(space.charAt(0));
                  spaceElement.classList.add(space.charAt(1));
               } else if (typeof space === 'number') {
                  spaceElement.classList.add('token');
                  spaceElement.classList.add('player' + space);
               }
               if (niya.isLegalMove(niyaGame, {
                     row: whichRow,
                     column: whichColumn
                  })) {
                  spaceElement.classList.add('legal-move');
               }
               rowElement.appendChild(spaceElement);
            });
            gameboardElement.appendChild(rowElement);
         });

         Array.prototype.slice.call(gameboardElement.querySelectorAll('.row')).forEach(function (rowElement, whichRow) {
            Array.prototype.slice.call(rowElement.querySelectorAll('.space')).forEach(function (spaceElement, whichColumn) {
               spaceElement.addEventListener('click', function () {
                  niyaGame = niya.makeMove(niyaGame, {
                     row: whichRow,
                     column: whichColumn
                  });
                  while (!niya.isGameOver(niyaGame) && document.querySelector('#ai-player' + niyaGame.nextPlayer).checked) {
                     niyaGame = niya.makeRandomMove(niyaGame);
                  }
                  updateNiyaGame();
               }, false);
            });
         });

         document.querySelector('#next-player-area').style.visibility = niya.isGameOver(niyaGame) ? 'hidden' : 'visible';
         nextPlayerElement = document.querySelector('#next-player');
         while (nextPlayerElement.hasChildNodes()) {
            nextPlayerElement.removeChild(nextPlayerElement.lastChild);
         }
         nextPlayerElement = document.createElement('div');
         nextPlayerElement.textContent = niyaGame.nextPlayer;
         nextPlayerElement.classList.add('space');
         nextPlayerElement.classList.add('token');
         nextPlayerElement.classList.add('player' + niyaGame.nextPlayer);
         document.querySelector('#next-player').appendChild(nextPlayerElement);

         document.querySelector('#last-card-area').style.visibility = niya.numMovesMade(niyaGame) > 0 ? 'visible' : 'hidden';
         lastCardElement = document.querySelector('#last-card');
         while (lastCardElement.hasChildNodes()) {
            lastCardElement.removeChild(lastCardElement.lastChild);
         }
         lastCardElement = document.createElement('div');
         lastCardElement.classList.add('space');
         lastCardElement.textContent = niyaGame.lastCard;
         if (typeof niyaGame.lastCard === 'string') {
            lastCardElement.classList.add(niyaGame.lastCard.charAt(0));
            lastCardElement.classList.add(niyaGame.lastCard.charAt(1));
         }
         document.querySelector('#last-card').appendChild(lastCardElement);

         document.querySelector('#result-area').style.visibility = niya.isGameOver(niyaGame) ? 'visible' : 'hidden';
         resultElement = document.querySelector('#result');
         while (resultElement.hasChildNodes()) {
            resultElement.removeChild(resultElement.lastChild);
         }
         resultElement = document.createElement('div');
         resultElement.classList.add('space');
         resultElement.classList.add('token');
         if (niya.hasPlayerWon(niyaGame, 1)) {
            resultElement.textContent = 1;
            resultElement.classList.add('player1');
         } else if (niya.hasPlayerWon(niyaGame, 2)) {
            resultElement.textContent = 2;
            resultElement.classList.add('player2');
         } else if (niya.isGameDrawn(niyaGame)) {
            resultElement.textContent = 'draw';
         }
         document.querySelector('#result').appendChild(resultElement);
      };

      document.querySelector('#start-new-game').addEventListener('click', function () {
         niyaGame = niya.createGame();
         while (!niya.isGameOver(niyaGame) && document.querySelector('#ai-player' + niyaGame.nextPlayer).checked) {
            niyaGame = niya.makeRandomMove(niyaGame);
         }
         updateNiyaGame();
      }, false);

      document.querySelector('#eval-moves').addEventListener('click', function () {
         setTimeout(function () {
            document.querySelector('#debug-output').value = (function () {
               var outputString;
               outputString = '';
               niyaGame.board.forEach(function (row, whichRow) {
                  row.forEach(function (space, whichColumn) {
                     outputString += ' ' + (niya.isLegalMove(niyaGame, {
                        row: whichRow,
                        column: whichColumn
                     }) ? niya.valueToPlayer(niya.makeMove(niyaGame, {
                        row: whichRow,
                        column: whichColumn
                     }), 1, 3) : '.');
                  });
                  outputString += '\n';
               });
               return outputString;
            }());
         }, 0);
      }, false);

      document.querySelector('#sim-random').addEventListener('click', function () {
         var d, game, w1, w2;
         w1 = 0;
         w2 = 0;
         d = 0;
         while (w1 + w2 + d < 10000) {
            game = niya.createGame();
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
         }
         document.querySelector('#debug-output').value = 'P1: ' + w1 + '\nP2: ' + w2 + '\n D: ' + d;
      }, false);

      try {
         niyaGame = niya.createGame(JSON.parse(localStorage && localStorage.getItem && localStorage.getItem('Niya')));
      } catch (problem) {
         niyaGame = niya.createGame();
      }
      updateNiyaGame();
   }());
}, false);
