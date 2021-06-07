import { NextApiRequest, NextApiResponse } from "next";

import FirestoreQuestion from "../../../../../services/database/firestore/question";
import QuestionController from "../../../_src/controllers/questionController";

const questionController = new QuestionController(new FirestoreQuestion());

const METHODS_HASH = {
    GET: questionController.show.bind(questionController),
    PUT: questionController.update.bind(questionController),
    DELETE: questionController.delete.bind(questionController)
}

export default (
    request: NextApiRequest, 
    response: NextApiResponse
) => METHODS_HASH[request.method](request, response);