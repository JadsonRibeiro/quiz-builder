"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const quiz_1 = __importDefault(require("../../../src/services/database/firestore/quiz"));
const contants_1 = require("../../../src/util/contants");
class QuizController {
    constructor() {
        //   [functionName: string]: Function;
        this.users = new Map();
        this.rooms = new Map();
        this.games = new Map();
    }
    // constructor() {}
    customEvent() {
        console.log("Custom Event trigged");
    }
    joinRoom(socket, { room, user }) {
        const roomID = room.roomID;
        console.log("User joined on room with socketID", socket.id, user, room);
        // Verificar se já há algum usuário com o mesmo username
        const updatedUser = this.updateGlobalUserData(socket.id, roomID, user);
        const updatedRoom = this.joinUserOnRoom(socket, roomID, updatedUser, room);
        // Send to other on room
        socket.to(roomID).emit(contants_1.constants.events.NEW_USER_ON_ROOM, { user: updatedUser, room: updatedRoom });
        // Send to user that joined
        socket.emit(contants_1.constants.events.NEW_USER_ON_ROOM, { user: updatedUser, room: updatedRoom });
    }
    disconnect(socket) {
        console.log('Disconnected user with id', socket.id);
        this.logoutUser(socket);
    }
    async startGame(socket, { roomID, teams, room: RoomData }) {
        var _a;
        console.log('Inicializando jogo...', roomID);
        let room = this.rooms.get(roomID);
        const { quizID } = room;
        room = Object.assign(Object.assign({ roomID }, room), RoomData);
        this.rooms.set(roomID, room);
        // Ir no banco e carregar todas as perguntas do quiz
        const database = new quiz_1.default();
        const quiz = await database.get(quizID);
        let questions = (_a = quiz.questions) !== null && _a !== void 0 ? _a : [];
        delete quiz.questions;
        // Forçar número par de questões
        if (questions.length % 2 !== 0)
            questions.shift();
        // Shuffle questions
        questions = questions.sort(() => Math.random() - 0.5);
        const currentQuestion = questions.shift();
        // Suffle options
        const options = currentQuestion.options;
        currentQuestion.options = options.sort(() => Math.random() - 0.5);
        // Escolher primeiro a jogar
        const currentTeam = Object.keys(teams).shift();
        // Setar pontos
        const points = Object.keys(teams).reduce((points, team) => (Object.assign(Object.assign({}, points), { [team]: 0 })), {});
        const game = {
            roomID,
            room,
            teams,
            quiz,
            questions,
            questionsQuantity: questions.length + 1,
            currentQuestionPosition: 1,
            currentQuestion,
            currentTeam,
            points
        };
        this.games.set(roomID, game);
        // Inicializa o jogo
        this.notifyAllRoom(socket, roomID, contants_1.constants.events.GAME_STARTED, {
            teams,
            points,
            room,
            questionsQuantity: questions.length + 1
        });
        // Dois segundos depois envia a primeira pergunta
        setTimeout(() => {
            this.notifyAllRoom(socket, roomID, contants_1.constants.events.NEXT_QUESTION, {
                currentQuestion,
                currentTeam,
                questionPosition: 1
            });
        }, 2000);
    }
    questionAnswered(socket, { roomID, choicedOptionID }) {
        console.log('Resposta recebida', roomID, choicedOptionID);
        const game = this.games.get(roomID);
        const room = this.rooms.get(roomID);
        console.log('Users on Room', room.users);
        // Verifica resposta
        const { currentQuestion } = game;
        const isRight = choicedOptionID === currentQuestion.answer;
        const points = Object.assign({}, game.points);
        if (isRight)
            points[game.currentTeam]++;
        game.points = points;
        // Envia resultado da resposta
        this.notifyAllRoom(socket, roomID, contants_1.constants.events.ANSWER_RESULT, {
            isRight,
            points
        });
        this.games.set(roomID, game);
        // Verifica se ainda há perguntas. Se não acaba o jogo
        if (!game.questions.length) {
            console.log('O jogo acabou!');
            this.notifyAllRoom(socket, roomID, contants_1.constants.events.GAME_FINISHED, {
                teams: game.teams,
                points
            });
        }
    }
    nextQuestionRequest(socket, { roomID }) {
        console.log('Solicitando nova pergunta...', roomID);
        const existingGame = this.games.has(roomID);
        if (!existingGame) {
            this.notifyAllRoom(socket, roomID, contants_1.constants.events.NON_EXISTENT_ROOM);
            return;
        }
        const game = this.games.get(roomID);
        // Obtem próxima pergunta
        const { questions } = game;
        // Verifica se ainda há perguntas. Se não, acaba o jogo
        if (!questions.length) {
            console.log('O jogo acabou!');
            this.notifyAllRoom(socket, roomID, contants_1.constants.events.GAME_FINISHED, {
                teams: game.teams,
                points: game.points
            });
            return;
        }
        const nextQuestion = questions.shift();
        // Shuffle options
        const options = nextQuestion.options;
        nextQuestion.options = options.sort(() => Math.random() - 0.5);
        game.currentQuestion = nextQuestion;
        game.currentQuestionPosition = game.questionsQuantity - questions.length;
        // Alterar time corrente
        const teamsID = Object.keys(game.teams);
        const nextTeam = teamsID.filter(teamID => teamID !== game.currentTeam).pop();
        game.currentTeam = nextTeam;
        this.games.set(roomID, game);
        this.notifyAllRoom(socket, roomID, contants_1.constants.events.NEXT_QUESTION, {
            currentQuestion: nextQuestion,
            currentTeam: nextTeam,
            questionPosition: game.currentQuestionPosition
        });
    }
    restartGame(socket, { roomID, teams, room }) {
        console.log('Reiniciando jogo...', roomID, teams);
        this.games.delete(roomID);
        this.startGame(socket, { roomID, teams, room });
    }
    notifyAllRoom(socket, roomID, event, data = {}) {
        socket.emit(event, data);
        socket.to(roomID).emit(event, data);
    }
    logoutUser(socket) {
        const socketID = socket.id;
        const user = this.users.get(socketID);
        if (!user)
            return;
        const roomID = user.roomID;
        // Remove usuario da lista de usuários
        this.users.delete(socketID);
        // Verifica se a sala ainda existe
        if (!this.rooms.has(roomID)) {
            console.log(`A sala com id ${roomID} não existia`);
            this.games.delete(roomID);
            return;
        }
        // Remove usuário da sala
        const room = this.rooms.get(roomID);
        const usersOnRoom = room.users;
        const filteredUsers = usersOnRoom.filter(u => u.username !== user.username);
        room.users = filteredUsers;
        // Se não tiver mais ninguém na sala, exclui ela
        if (filteredUsers.length === 0) {
            this.rooms.delete(roomID);
            this.games.delete(roomID);
            return;
        }
        // Verifica se usuário que saiu era o dono da sala. Se for, passar posse para outro
        const currentOwner = room.owner;
        if (currentOwner.username === user.username) {
            const newOnwer = filteredUsers[0];
            room.owner = newOnwer;
        }
        this.rooms.set(roomID, room);
        socket.to(roomID).emit(contants_1.constants.events.USER_DISCONNECTED, { user, room });
    }
    updateGlobalUserData(socketID, roomID, user) {
        var _a;
        let oldUserData = (_a = this.users.get(socketID)) !== null && _a !== void 0 ? _a : {};
        // Verifica se já havia um usuário com o mesmo username
        // Se houver, remove-o
        this.users.forEach((currentUser, id) => {
            if (currentUser.username === user.username) {
                this.users.delete(id);
            }
        });
        const updatedUser = Object.assign(Object.assign({ socketID,
            roomID }, oldUserData), user);
        this.users.set(socketID, updatedUser);
        return this.users.get(socketID);
    }
    joinUserOnRoom(socket, roomID, user, room) {
        const roomExists = this.rooms.has(roomID);
        socket.join(roomID);
        let currentRoom;
        let owner = user;
        let users = [];
        if (roomExists) {
            currentRoom = this.rooms.get(roomID);
            owner = currentRoom.owner;
            users = currentRoom.users;
        }
        // Verifica se já havia um usuário com o mesmo username. Se houver, remove-o.
        users = users.filter(currentUser => currentUser.username !== user.username);
        users.push(user);
        const updateRoom = Object.assign(Object.assign(Object.assign({ roomID }, currentRoom), room), { owner,
            users });
        this.rooms.set(roomID, updateRoom);
        return this.rooms.get(roomID);
    }
    getFunction(functionName) {
        return this[functionName].bind(this);
    }
    getEvents() {
        const functions = Reflect.ownKeys(QuizController.prototype)
            .filter((functionName) => functionName !== "constructor")
            .map((functionName) => [
            functionName,
            this.getFunction(String(functionName)),
        ]);
        return functions;
    }
}
exports.default = QuizController;
