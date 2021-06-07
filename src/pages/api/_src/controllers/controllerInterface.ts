import { NextApiRequest, NextApiResponse } from "next";

export default interface ControllerInterface {
    index: (request: NextApiRequest, response: NextApiResponse) => Promise<void>;
    show: (request: NextApiRequest, response: NextApiResponse) => Promise<void>;
    create: (request: NextApiRequest, response: NextApiResponse) => Promise<void>;
    delete: (request: NextApiRequest, response: NextApiResponse) => Promise<void>;
    update: (request: NextApiRequest, response: NextApiResponse) => Promise<void>;
} 