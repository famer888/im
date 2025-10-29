import { isNUN } from "./base";

export const formatChannelManages = (list) => {
    return list.map(item => {
        const type = isNUN(item?.type) ? 2 : Number(item?.type);
        return {
            ...item,
            memberType: {0: 1, 1: 2, 2: 3}[type]
        }
    })
}