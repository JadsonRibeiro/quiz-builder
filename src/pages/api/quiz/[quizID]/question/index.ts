import { NextApiRequest, NextApiResponse } from "next";

import FirestoreQuestion from "../../../../../services/database/firestore/question";
import QuestionController from "../../../_src/controllers/questionController";

const questionController = new QuestionController(new FirestoreQuestion());

const METHODS_HASH = {
    POST: questionController.create.bind(questionController),
    GET: questionController.index.bind(questionController)
}

export default (
    request: NextApiRequest, 
    response: NextApiResponse
) => METHODS_HASH[request.method](request, response);