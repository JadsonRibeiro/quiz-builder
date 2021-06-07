export interface Quiz {
    quizID: string;
    name: string;
    ownerEmail: string;
    private: boolean;
    category: string;
    questions?: Question[];
}

interface Option {
    id: string;
    value: string
}

export interface Question {
    id?: string;
    question: string;
    answer: string;
    options: Option[];
    reference?: string;
    type: 'simpleQuestion' | 'otherType'
}

export interface User {
    userID?: string;
    name: string;
    email: string;
    roomID?: string;
}

export interface Room {
    roomID: string;
    name: string;
    quizID: string;
    owner: User;
    users?: User[],
    timeToAnswer?: number
}

export interface Game {
    roomID: string;
    room: Room;
    teams: {
        [teamID: string]: Team
    },
    quiz: Quiz;
    questions: Question[],
    questionsQuantity: number;
    currentQuestionPosition: number;
    currentQuestion: Question;
    currentTeam: string;
    points: {
        [teamID: string]: number
    }
}

export interface Team {
    teamID?: number;
    position: number;
    name: string;
    members: User[]
}