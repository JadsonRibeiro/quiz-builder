import { NextApiRequest, NextApiResponse } from 'next';

import { QuestionServiceInterface } from '../../../../interfaces/servicesInterfaces';
import ControllerInterface from './controllerInterface';

export default class QuizController implements ControllerInterface{
    private service: QuestionServiceInterface;
    
    constructor(service: QuestionServiceInterface) {
        this.service = service;
    }

    async index(request: NextApiRequest, response: NextApiResponse) {}
    
    async show(request: NextApiRequest, response: NextApiResponse) {}

    async create(request: NextApiRequest, response: NextApiResponse) {
        const { quizID } = request.query;
        const questionID = await this.service.create(String(quizID), request.body);

        return response.status(200).json({ questionID });
    }

    async delete(request: NextApiRequest, response: NextApiResponse) {
        const { quizID, questionID } = request.query;

        try {
            await this.service.delete(String(quizID), String(questionID));
            return response.status(200).end();
        } catch(e) {
            return response.status(500).end();
        }
    }

    async update(request: NextApiRequest, response: NextApiResponse) {
        const { quizID, questionID } = request.query;

        try {
            await this.service.update(String(quizID), String(questionID), request.body);
            return response.status(200).end();
        } catch(e) {
            return response.status(500).end();
        }
    }
}