import { NextApiRequest, NextApiResponse } from "next";

import FirestoreQuiz from "../../../../services/database/firestore/quiz";
import QuizController from "../../_src/controllers/quizController";

const quizController = new QuizController(new FirestoreQuiz());

const METHODS_HASH = {
    GET: quizController.show.bind(quizController),
    PUT: quizController.update.bind(quizController),
    DELETE: quizController.delete.bind(quizController),
}

export default (
    request: NextApiRequest, 
    response: NextApiResponse
) => METHODS_HASH[request.method](request, response);