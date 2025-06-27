import * as Sentry from "@sentry/browser";

const addTag = (scope, err_type, tags) => {
    const tagTypeMsgs = {
        1: "http错误",
        2: "webSocket错误",
        3: "electron错误",
    };
    scope.setTag("err_type", err_type);
    scope.setTag("err_type_msg", tagTypeMsgs[err_type]);
    if (tags && tags.length) {
        tags.forEach((item) => {
            scope.setTag(item.name, item.value);
        });
    }
};

/**
 * 发送错误到sentry
 * @param {Number} err_type 0:自动捕获, 1:'http',2:'socket',3:'electron'
 * @param {String} errContent 错误内容
 * @param {String} tags 自定义tag [{name,value}]
 */
export const sendErrToSentry = (err_type, errContent, tags = []) => {
    Sentry.withScope((scope) => {
        addTag(scope, err_type, tags);
        Sentry.captureException(
            typeof errContent === "object"
                ? JSON.stringify(errContent)
                : errContent
        );
    });
};
