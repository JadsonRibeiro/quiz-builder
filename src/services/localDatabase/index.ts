import { Room, User } from "../../interfaces/entitiesInterfaces";

const FIELD_ROOM = '@QuizBuilder:rooms';
const FIELD_USER = '@QuizBuilder:user';

export interface StorageData<Type> {
    [id: string]: Type
}

export class LocalDatabase {
    static saveRoom(room: Omit<Room, 'owner'>) {
        const data = sessionStorage.getItem(FIELD_ROOM);
        const oldRooms = data ? (JSON.parse(data) as StorageData<Room>) : {};

        const newRoom = {
            [room.roomID]: room
        }

        sessionStorage.setItem(FIELD_ROOM, 
            JSON.stringify({
                ...newRoom,
                ...oldRooms
        }));
    }

    static getRoom(id: string) {
        const data = sessionStorage.getItem(FIELD_ROOM);
        const rooms = data ? (JSON.parse(data) as StorageData<Room>) : {};

        return rooms[id] ? rooms[id] : null;
    }

    static saveUser(user: User) {
        sessionStorage.setItem(FIELD_USER, JSON.stringify(user));
    }

    static getUser(): User {
        const data = sessionStorage.getItem(FIELD_USER);
        const user = data ? (JSON.parse(data) as User) : null;
        return user;
    }
}