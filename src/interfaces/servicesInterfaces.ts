import { Question, Quiz } from "./entitiesInterfaces";

export interface QuizServiceInterface {
    create(quiz: Quiz): Promise<string>;
    update(quizID: string, quiz: Quiz): Promise<void>;
    get(quizID: string): Promise<Quiz>;
    delete(quizID: string): Promise<void>;
}

export interface QuestionServiceInterface {
    create(quizID: string, question: Question): Promise<string>;
    update(quizID: string, questionID: string, question: Question): Promise<void>;
    get(quizID: string, questionID: string): Promise<Question>;
    delete(quizID: string, questionID: string): Promise<void>;
}