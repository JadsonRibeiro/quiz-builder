import { NextApiRequest, NextApiResponse } from 'next';

import { QuizServiceInterface } from '../../../../interfaces/servicesInterfaces';
import ControllerInterface from './controllerInterface';

export default class QuizController implements ControllerInterface{
    private service: QuizServiceInterface;
    
    constructor(service: QuizServiceInterface) {
        this.service = service;
    }

    async index(request: NextApiRequest, response: NextApiResponse) {}
    
    async show(request: NextApiRequest, response: NextApiResponse) {
        const { quizID } = request.query;

        const quiz = await this.service.get(String(quizID));

        if(!quiz) {
            return response.status(204).end();
        } else {
            return response.status(200).json({ quiz });
        }
    }

    async create(request: NextApiRequest, response: NextApiResponse) {
        const quizID = await this.service.create(request.body);

        return response.status(200).json({ quizID });
    }

    async delete(request: NextApiRequest, response: NextApiResponse) {
        const { quizID } = request.query;
        await this.service.delete(String(quizID));

        return response.status(204).end();
    }

    async update(request: NextApiRequest, response: NextApiResponse) {
        console.log('Atualizando quiz...', request.body);
        const { quizID } = request.query;

        try {
            await this.service.update(String(quizID), request.body);
            return response.status(200).end();
        } catch(e) {
            return response.status(500).end();
        }
    }
}