/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

/**
 * ChannelEventType enum.
 * @exports ChannelEventType
 * @enum {number}
 * @property {number} FORCE_INIT=0 FORCE_INIT value
 * @property {number} CHANNEL_EVENT=1 CHANNEL_EVENT value
 * @property {number} CHANNEL_SUBSCRIBER_EVENT=2 CHANNEL_SUBSCRIBER_EVENT value
 */
export const ChannelEventType = $root.ChannelEventType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "FORCE_INIT"] = 0;
    values[valuesById[1] = "CHANNEL_EVENT"] = 1;
    values[valuesById[2] = "CHANNEL_SUBSCRIBER_EVENT"] = 2;
    return values;
})();

/**
 * ChannelOperateType enum.
 * @exports ChannelOperateType
 * @enum {number}
 * @property {number} CHANNEL_CREATE=0 CHANNEL_CREATE value
 * @property {number} CHANNEL_NAME=1 CHANNEL_NAME value
 * @property {number} CHANNEL_ICON=2 CHANNEL_ICON value
 * @property {number} CHANNEL_CONTENT=3 CHANNEL_CONTENT value
 * @property {number} CHANNEL_REMOVE=4 CHANNEL_REMOVE value
 * @property {number} CHANNEL_ENABLE=5 CHANNEL_ENABLE value
 * @property {number} CHANNEL_DISABLE=6 CHANNEL_DISABLE value
 * @property {number} CHANNEL_DISMISS=7 CHANNEL_DISMISS value
 */
export const ChannelOperateType = $root.ChannelOperateType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "CHANNEL_CREATE"] = 0;
    values[valuesById[1] = "CHANNEL_NAME"] = 1;
    values[valuesById[2] = "CHANNEL_ICON"] = 2;
    values[valuesById[3] = "CHANNEL_CONTENT"] = 3;
    values[valuesById[4] = "CHANNEL_REMOVE"] = 4;
    values[valuesById[5] = "CHANNEL_ENABLE"] = 5;
    values[valuesById[6] = "CHANNEL_DISABLE"] = 6;
    values[valuesById[7] = "CHANNEL_DISMISS"] = 7;
    return values;
})();

/**
 * SubscriberOperateType enum.
 * @exports SubscriberOperateType
 * @enum {number}
 * @property {number} SUBSCRIBER_JOIN=0 SUBSCRIBER_JOIN value
 * @property {number} SUBSCRIBER_PRIVILEGE_UPDATE=1 SUBSCRIBER_PRIVILEGE_UPDATE value
 * @property {number} SUBSCRIBER_REMOVE=2 SUBSCRIBER_REMOVE value
 * @property {number} SUBSCRIBER_INVITE=3 SUBSCRIBER_INVITE value
 */
export const SubscriberOperateType = $root.SubscriberOperateType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "SUBSCRIBER_JOIN"] = 0;
    values[valuesById[1] = "SUBSCRIBER_PRIVILEGE_UPDATE"] = 1;
    values[valuesById[2] = "SUBSCRIBER_REMOVE"] = 2;
    values[valuesById[3] = "SUBSCRIBER_INVITE"] = 3;
    return values;
})();

/**
 * AdminOperateType enum.
 * @exports AdminOperateType
 * @enum {number}
 * @property {number} ADMIN_ADD=0 ADMIN_ADD value
 * @property {number} ADMIN_DELETE=1 ADMIN_DELETE value
 */
export const AdminOperateType = $root.AdminOperateType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "ADMIN_ADD"] = 0;
    values[valuesById[1] = "ADMIN_DELETE"] = 1;
    return values;
})();

export const ChannelInfo = $root.ChannelInfo = (() => {

    /**
     * Properties of a ChannelInfo.
     * @exports IChannelInfo
     * @interface IChannelInfo
     * @property {ChannelOperateType|null} [operateType] ChannelInfo operateType
     * @property {string|null} [channelName] ChannelInfo channelName
     * @property {string|null} [icon] ChannelInfo icon
     * @property {boolean|null} [contentLimit] ChannelInfo contentLimit
     */

    /**
     * Constructs a new ChannelInfo.
     * @exports ChannelInfo
     * @classdesc Represents a ChannelInfo.
     * @implements IChannelInfo
     * @constructor
     * @param {IChannelInfo=} [properties] Properties to set
     */
    function ChannelInfo(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ChannelInfo operateType.
     * @member {ChannelOperateType} operateType
     * @memberof ChannelInfo
     * @instance
     */
    ChannelInfo.prototype.operateType = 0;

    /**
     * ChannelInfo channelName.
     * @member {string} channelName
     * @memberof ChannelInfo
     * @instance
     */
    ChannelInfo.prototype.channelName = "";

    /**
     * ChannelInfo icon.
     * @member {string} icon
     * @memberof ChannelInfo
     * @instance
     */
    ChannelInfo.prototype.icon = "";

    /**
     * ChannelInfo contentLimit.
     * @member {boolean} contentLimit
     * @memberof ChannelInfo
     * @instance
     */
    ChannelInfo.prototype.contentLimit = false;

    /**
     * Creates a new ChannelInfo instance using the specified properties.
     * @function create
     * @memberof ChannelInfo
     * @static
     * @param {IChannelInfo=} [properties] Properties to set
     * @returns {ChannelInfo} ChannelInfo instance
     */
    ChannelInfo.create = function create(properties) {
        return new ChannelInfo(properties);
    };

    /**
     * Encodes the specified ChannelInfo message. Does not implicitly {@link ChannelInfo.verify|verify} messages.
     * @function encode
     * @memberof ChannelInfo
     * @static
     * @param {IChannelInfo} message ChannelInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ChannelInfo.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.operateType != null && Object.hasOwnProperty.call(message, "operateType"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.operateType);
        if (message.channelName != null && Object.hasOwnProperty.call(message, "channelName"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.channelName);
        if (message.icon != null && Object.hasOwnProperty.call(message, "icon"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.icon);
        if (message.contentLimit != null && Object.hasOwnProperty.call(message, "contentLimit"))
            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.contentLimit);
        return writer;
    };

    /**
     * Encodes the specified ChannelInfo message, length delimited. Does not implicitly {@link ChannelInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ChannelInfo
     * @static
     * @param {IChannelInfo} message ChannelInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ChannelInfo.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ChannelInfo message from the specified reader or buffer.
     * @function decode
     * @memberof ChannelInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ChannelInfo} ChannelInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ChannelInfo.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.ChannelInfo();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.operateType = reader.int32();
                    break;
                }
            case 2: {
                    message.channelName = reader.string();
                    break;
                }
            case 3: {
                    message.icon = reader.string();
                    break;
                }
            case 4: {
                    message.contentLimit = reader.bool();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a ChannelInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ChannelInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ChannelInfo} ChannelInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ChannelInfo.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ChannelInfo message.
     * @function verify
     * @memberof ChannelInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ChannelInfo.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.operateType != null && message.hasOwnProperty("operateType"))
            switch (message.operateType) {
            default:
                return "operateType: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                break;
            }
        if (message.channelName != null && message.hasOwnProperty("channelName"))
            if (!$util.isString(message.channelName))
                return "channelName: string expected";
        if (message.icon != null && message.hasOwnProperty("icon"))
            if (!$util.isString(message.icon))
                return "icon: string expected";
        if (message.contentLimit != null && message.hasOwnProperty("contentLimit"))
            if (typeof message.contentLimit !== "boolean")
                return "contentLimit: boolean expected";
        return null;
    };

    /**
     * Creates a ChannelInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ChannelInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ChannelInfo} ChannelInfo
     */
    ChannelInfo.fromObject = function fromObject(object) {
        if (object instanceof $root.ChannelInfo)
            return object;
        let message = new $root.ChannelInfo();
        switch (object.operateType) {
        default:
            if (typeof object.operateType === "number") {
                message.operateType = object.operateType;
                break;
            }
            break;
        case "CHANNEL_CREATE":
        case 0:
            message.operateType = 0;
            break;
        case "CHANNEL_NAME":
        case 1:
            message.operateType = 1;
            break;
        case "CHANNEL_ICON":
        case 2:
            message.operateType = 2;
            break;
        case "CHANNEL_CONTENT":
        case 3:
            message.operateType = 3;
            break;
        case "CHANNEL_REMOVE":
        case 4:
            message.operateType = 4;
            break;
        case "CHANNEL_ENABLE":
        case 5:
            message.operateType = 5;
            break;
        case "CHANNEL_DISABLE":
        case 6:
            message.operateType = 6;
            break;
        case "CHANNEL_DISMISS":
        case 7:
            message.operateType = 7;
            break;
        }
        if (object.channelName != null)
            message.channelName = String(object.channelName);
        if (object.icon != null)
            message.icon = String(object.icon);
        if (object.contentLimit != null)
            message.contentLimit = Boolean(object.contentLimit);
        return message;
    };

    /**
     * Creates a plain object from a ChannelInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ChannelInfo
     * @static
     * @param {ChannelInfo} message ChannelInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ChannelInfo.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.operateType = options.enums === String ? "CHANNEL_CREATE" : 0;
            object.channelName = "";
            object.icon = "";
            object.contentLimit = false;
        }
        if (message.operateType != null && message.hasOwnProperty("operateType"))
            object.operateType = options.enums === String ? $root.ChannelOperateType[message.operateType] === undefined ? message.operateType : $root.ChannelOperateType[message.operateType] : message.operateType;
        if (message.channelName != null && message.hasOwnProperty("channelName"))
            object.channelName = message.channelName;
        if (message.icon != null && message.hasOwnProperty("icon"))
            object.icon = message.icon;
        if (message.contentLimit != null && message.hasOwnProperty("contentLimit"))
            object.contentLimit = message.contentLimit;
        return object;
    };

    /**
     * Converts this ChannelInfo to JSON.
     * @function toJSON
     * @memberof ChannelInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ChannelInfo.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ChannelInfo
     * @function getTypeUrl
     * @memberof ChannelInfo
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ChannelInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/ChannelInfo";
    };

    return ChannelInfo;
})();

/**
 * SubscriberRole enum.
 * @exports SubscriberRole
 * @enum {number}
 * @property {number} OWNER=0 OWNER value
 * @property {number} ADMIN=1 ADMIN value
 * @property {number} NONE=2 NONE value
 */
export const SubscriberRole = $root.SubscriberRole = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "OWNER"] = 0;
    values[valuesById[1] = "ADMIN"] = 1;
    values[valuesById[2] = "NONE"] = 2;
    return values;
})();

export const SubscriberInfo = $root.SubscriberInfo = (() => {

    /**
     * Properties of a SubscriberInfo.
     * @exports ISubscriberInfo
     * @interface ISubscriberInfo
     * @property {SubscriberOperateType|null} [operateType] SubscriberInfo operateType
     * @property {SubscriberRole|null} [role] SubscriberInfo role
     * @property {number|null} [privilege] SubscriberInfo privilege
     * @property {ChannelReqStatus|null} [reqStatus] SubscriberInfo reqStatus
     * @property {AdminOperateType|null} [adminOperateType] SubscriberInfo adminOperateType
     */

    /**
     * Constructs a new SubscriberInfo.
     * @exports SubscriberInfo
     * @classdesc Represents a SubscriberInfo.
     * @implements ISubscriberInfo
     * @constructor
     * @param {ISubscriberInfo=} [properties] Properties to set
     */
    function SubscriberInfo(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * SubscriberInfo operateType.
     * @member {SubscriberOperateType} operateType
     * @memberof SubscriberInfo
     * @instance
     */
    SubscriberInfo.prototype.operateType = 0;

    /**
     * SubscriberInfo role.
     * @member {SubscriberRole} role
     * @memberof SubscriberInfo
     * @instance
     */
    SubscriberInfo.prototype.role = 0;

    /**
     * SubscriberInfo privilege.
     * @member {number} privilege
     * @memberof SubscriberInfo
     * @instance
     */
    SubscriberInfo.prototype.privilege = 0;

    /**
     * SubscriberInfo reqStatus.
     * @member {ChannelReqStatus} reqStatus
     * @memberof SubscriberInfo
     * @instance
     */
    SubscriberInfo.prototype.reqStatus = 0;

    /**
     * SubscriberInfo adminOperateType.
     * @member {AdminOperateType} adminOperateType
     * @memberof SubscriberInfo
     * @instance
     */
    SubscriberInfo.prototype.adminOperateType = 0;

    /**
     * Creates a new SubscriberInfo instance using the specified properties.
     * @function create
     * @memberof SubscriberInfo
     * @static
     * @param {ISubscriberInfo=} [properties] Properties to set
     * @returns {SubscriberInfo} SubscriberInfo instance
     */
    SubscriberInfo.create = function create(properties) {
        return new SubscriberInfo(properties);
    };

    /**
     * Encodes the specified SubscriberInfo message. Does not implicitly {@link SubscriberInfo.verify|verify} messages.
     * @function encode
     * @memberof SubscriberInfo
     * @static
     * @param {ISubscriberInfo} message SubscriberInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SubscriberInfo.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.operateType != null && Object.hasOwnProperty.call(message, "operateType"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.operateType);
        if (message.role != null && Object.hasOwnProperty.call(message, "role"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.role);
        if (message.privilege != null && Object.hasOwnProperty.call(message, "privilege"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.privilege);
        if (message.reqStatus != null && Object.hasOwnProperty.call(message, "reqStatus"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.reqStatus);
        if (message.adminOperateType != null && Object.hasOwnProperty.call(message, "adminOperateType"))
            writer.uint32(/* id 5, wireType 0 =*/40).int32(message.adminOperateType);
        return writer;
    };

    /**
     * Encodes the specified SubscriberInfo message, length delimited. Does not implicitly {@link SubscriberInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof SubscriberInfo
     * @static
     * @param {ISubscriberInfo} message SubscriberInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SubscriberInfo.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a SubscriberInfo message from the specified reader or buffer.
     * @function decode
     * @memberof SubscriberInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SubscriberInfo} SubscriberInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SubscriberInfo.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.SubscriberInfo();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.operateType = reader.int32();
                    break;
                }
            case 2: {
                    message.role = reader.int32();
                    break;
                }
            case 3: {
                    message.privilege = reader.int32();
                    break;
                }
            case 4: {
                    message.reqStatus = reader.int32();
                    break;
                }
            case 5: {
                    message.adminOperateType = reader.int32();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a SubscriberInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof SubscriberInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {SubscriberInfo} SubscriberInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SubscriberInfo.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a SubscriberInfo message.
     * @function verify
     * @memberof SubscriberInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    SubscriberInfo.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.operateType != null && message.hasOwnProperty("operateType"))
            switch (message.operateType) {
            default:
                return "operateType: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
                break;
            }
        if (message.role != null && message.hasOwnProperty("role"))
            switch (message.role) {
            default:
                return "role: enum value expected";
            case 0:
            case 1:
            case 2:
                break;
            }
        if (message.privilege != null && message.hasOwnProperty("privilege"))
            if (!$util.isInteger(message.privilege))
                return "privilege: integer expected";
        if (message.reqStatus != null && message.hasOwnProperty("reqStatus"))
            switch (message.reqStatus) {
            default:
                return "reqStatus: enum value expected";
            case 0:
            case 1:
            case 2:
                break;
            }
        if (message.adminOperateType != null && message.hasOwnProperty("adminOperateType"))
            switch (message.adminOperateType) {
            default:
                return "adminOperateType: enum value expected";
            case 0:
            case 1:
                break;
            }
        return null;
    };

    /**
     * Creates a SubscriberInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof SubscriberInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {SubscriberInfo} SubscriberInfo
     */
    SubscriberInfo.fromObject = function fromObject(object) {
        if (object instanceof $root.SubscriberInfo)
            return object;
        let message = new $root.SubscriberInfo();
        switch (object.operateType) {
        default:
            if (typeof object.operateType === "number") {
                message.operateType = object.operateType;
                break;
            }
            break;
        case "SUBSCRIBER_JOIN":
        case 0:
            message.operateType = 0;
            break;
        case "SUBSCRIBER_PRIVILEGE_UPDATE":
        case 1:
            message.operateType = 1;
            break;
        case "SUBSCRIBER_REMOVE":
        case 2:
            message.operateType = 2;
            break;
        case "SUBSCRIBER_INVITE":
        case 3:
            message.operateType = 3;
            break;
        }
        switch (object.role) {
        default:
            if (typeof object.role === "number") {
                message.role = object.role;
                break;
            }
            break;
        case "OWNER":
        case 0:
            message.role = 0;
            break;
        case "ADMIN":
        case 1:
            message.role = 1;
            break;
        case "NONE":
        case 2:
            message.role = 2;
            break;
        }
        if (object.privilege != null)
            message.privilege = object.privilege | 0;
        switch (object.reqStatus) {
        default:
            if (typeof object.reqStatus === "number") {
                message.reqStatus = object.reqStatus;
                break;
            }
            break;
        case "CHANNEL_CHECKING":
        case 0:
            message.reqStatus = 0;
            break;
        case "CHANNEL_AGREE":
        case 1:
            message.reqStatus = 1;
            break;
        case "CHANNEL_REFUSE":
        case 2:
            message.reqStatus = 2;
            break;
        }
        switch (object.adminOperateType) {
        default:
            if (typeof object.adminOperateType === "number") {
                message.adminOperateType = object.adminOperateType;
                break;
            }
            break;
        case "ADMIN_ADD":
        case 0:
            message.adminOperateType = 0;
            break;
        case "ADMIN_DELETE":
        case 1:
            message.adminOperateType = 1;
            break;
        }
        return message;
    };

    /**
     * Creates a plain object from a SubscriberInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof SubscriberInfo
     * @static
     * @param {SubscriberInfo} message SubscriberInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    SubscriberInfo.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.operateType = options.enums === String ? "SUBSCRIBER_JOIN" : 0;
            object.role = options.enums === String ? "OWNER" : 0;
            object.privilege = 0;
            object.reqStatus = options.enums === String ? "CHANNEL_CHECKING" : 0;
            object.adminOperateType = options.enums === String ? "ADMIN_ADD" : 0;
        }
        if (message.operateType != null && message.hasOwnProperty("operateType"))
            object.operateType = options.enums === String ? $root.SubscriberOperateType[message.operateType] === undefined ? message.operateType : $root.SubscriberOperateType[message.operateType] : message.operateType;
        if (message.role != null && message.hasOwnProperty("role"))
            object.role = options.enums === String ? $root.SubscriberRole[message.role] === undefined ? message.role : $root.SubscriberRole[message.role] : message.role;
        if (message.privilege != null && message.hasOwnProperty("privilege"))
            object.privilege = message.privilege;
        if (message.reqStatus != null && message.hasOwnProperty("reqStatus"))
            object.reqStatus = options.enums === String ? $root.ChannelReqStatus[message.reqStatus] === undefined ? message.reqStatus : $root.ChannelReqStatus[message.reqStatus] : message.reqStatus;
        if (message.adminOperateType != null && message.hasOwnProperty("adminOperateType"))
            object.adminOperateType = options.enums === String ? $root.AdminOperateType[message.adminOperateType] === undefined ? message.adminOperateType : $root.AdminOperateType[message.adminOperateType] : message.adminOperateType;
        return object;
    };

    /**
     * Converts this SubscriberInfo to JSON.
     * @function toJSON
     * @memberof SubscriberInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    SubscriberInfo.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for SubscriberInfo
     * @function getTypeUrl
     * @memberof SubscriberInfo
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    SubscriberInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/SubscriberInfo";
    };

    return SubscriberInfo;
})();

export const ChannelEventMessage = $root.ChannelEventMessage = (() => {

    /**
     * Properties of a ChannelEventMessage.
     * @exports IChannelEventMessage
     * @interface IChannelEventMessage
     * @property {number|Long|null} [msgId] ChannelEventMessage msgId
     * @property {ChannelEventType|null} [eventType] ChannelEventMessage eventType
     * @property {number|Long|null} [channelId] ChannelEventMessage channelId
     * @property {IChannelInfo|null} [channelInfo] ChannelEventMessage channelInfo
     * @property {ISubscriberInfo|null} [subscriberInfo] ChannelEventMessage subscriberInfo
     * @property {number|Long|null} [msgTime] ChannelEventMessage msgTime
     * @property {string|null} [msg] ChannelEventMessage msg
     * @property {IChannelNoticeMsg|null} [channelNoticeMsg] ChannelEventMessage channelNoticeMsg
     */

    /**
     * Constructs a new ChannelEventMessage.
     * @exports ChannelEventMessage
     * @classdesc Represents a ChannelEventMessage.
     * @implements IChannelEventMessage
     * @constructor
     * @param {IChannelEventMessage=} [properties] Properties to set
     */
    function ChannelEventMessage(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ChannelEventMessage msgId.
     * @member {number|Long} msgId
     * @memberof ChannelEventMessage
     * @instance
     */
    ChannelEventMessage.prototype.msgId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * ChannelEventMessage eventType.
     * @member {ChannelEventType} eventType
     * @memberof ChannelEventMessage
     * @instance
     */
    ChannelEventMessage.prototype.eventType = 0;

    /**
     * ChannelEventMessage channelId.
     * @member {number|Long} channelId
     * @memberof ChannelEventMessage
     * @instance
     */
    ChannelEventMessage.prototype.channelId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * ChannelEventMessage channelInfo.
     * @member {IChannelInfo|null|undefined} channelInfo
     * @memberof ChannelEventMessage
     * @instance
     */
    ChannelEventMessage.prototype.channelInfo = null;

    /**
     * ChannelEventMessage subscriberInfo.
     * @member {ISubscriberInfo|null|undefined} subscriberInfo
     * @memberof ChannelEventMessage
     * @instance
     */
    ChannelEventMessage.prototype.subscriberInfo = null;

    /**
     * ChannelEventMessage msgTime.
     * @member {number|Long} msgTime
     * @memberof ChannelEventMessage
     * @instance
     */
    ChannelEventMessage.prototype.msgTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * ChannelEventMessage msg.
     * @member {string} msg
     * @memberof ChannelEventMessage
     * @instance
     */
    ChannelEventMessage.prototype.msg = "";

    /**
     * ChannelEventMessage channelNoticeMsg.
     * @member {IChannelNoticeMsg|null|undefined} channelNoticeMsg
     * @memberof ChannelEventMessage
     * @instance
     */
    ChannelEventMessage.prototype.channelNoticeMsg = null;

    /**
     * Creates a new ChannelEventMessage instance using the specified properties.
     * @function create
     * @memberof ChannelEventMessage
     * @static
     * @param {IChannelEventMessage=} [properties] Properties to set
     * @returns {ChannelEventMessage} ChannelEventMessage instance
     */
    ChannelEventMessage.create = function create(properties) {
        return new ChannelEventMessage(properties);
    };

    /**
     * Encodes the specified ChannelEventMessage message. Does not implicitly {@link ChannelEventMessage.verify|verify} messages.
     * @function encode
     * @memberof ChannelEventMessage
     * @static
     * @param {IChannelEventMessage} message ChannelEventMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ChannelEventMessage.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.msgId != null && Object.hasOwnProperty.call(message, "msgId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.msgId);
        if (message.eventType != null && Object.hasOwnProperty.call(message, "eventType"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.eventType);
        if (message.channelId != null && Object.hasOwnProperty.call(message, "channelId"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.channelId);
        if (message.channelInfo != null && Object.hasOwnProperty.call(message, "channelInfo"))
            $root.ChannelInfo.encode(message.channelInfo, writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
        if (message.subscriberInfo != null && Object.hasOwnProperty.call(message, "subscriberInfo"))
            $root.SubscriberInfo.encode(message.subscriberInfo, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
        if (message.msgTime != null && Object.hasOwnProperty.call(message, "msgTime"))
            writer.uint32(/* id 6, wireType 0 =*/48).int64(message.msgTime);
        if (message.msg != null && Object.hasOwnProperty.call(message, "msg"))
            writer.uint32(/* id 7, wireType 2 =*/58).string(message.msg);
        if (message.channelNoticeMsg != null && Object.hasOwnProperty.call(message, "channelNoticeMsg"))
            $root.ChannelNoticeMsg.encode(message.channelNoticeMsg, writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified ChannelEventMessage message, length delimited. Does not implicitly {@link ChannelEventMessage.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ChannelEventMessage
     * @static
     * @param {IChannelEventMessage} message ChannelEventMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ChannelEventMessage.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ChannelEventMessage message from the specified reader or buffer.
     * @function decode
     * @memberof ChannelEventMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ChannelEventMessage} ChannelEventMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ChannelEventMessage.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.ChannelEventMessage();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.msgId = reader.int64();
                    break;
                }
            case 2: {
                    message.eventType = reader.int32();
                    break;
                }
            case 3: {
                    message.channelId = reader.int64();
                    break;
                }
            case 4: {
                    message.channelInfo = $root.ChannelInfo.decode(reader, reader.uint32());
                    break;
                }
            case 5: {
                    message.subscriberInfo = $root.SubscriberInfo.decode(reader, reader.uint32());
                    break;
                }
            case 6: {
                    message.msgTime = reader.int64();
                    break;
                }
            case 7: {
                    message.msg = reader.string();
                    break;
                }
            case 8: {
                    message.channelNoticeMsg = $root.ChannelNoticeMsg.decode(reader, reader.uint32());
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a ChannelEventMessage message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ChannelEventMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ChannelEventMessage} ChannelEventMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ChannelEventMessage.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ChannelEventMessage message.
     * @function verify
     * @memberof ChannelEventMessage
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ChannelEventMessage.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.msgId != null && message.hasOwnProperty("msgId"))
            if (!$util.isInteger(message.msgId) && !(message.msgId && $util.isInteger(message.msgId.low) && $util.isInteger(message.msgId.high)))
                return "msgId: integer|Long expected";
        if (message.eventType != null && message.hasOwnProperty("eventType"))
            switch (message.eventType) {
            default:
                return "eventType: enum value expected";
            case 0:
            case 1:
            case 2:
                break;
            }
        if (message.channelId != null && message.hasOwnProperty("channelId"))
            if (!$util.isInteger(message.channelId) && !(message.channelId && $util.isInteger(message.channelId.low) && $util.isInteger(message.channelId.high)))
                return "channelId: integer|Long expected";
        if (message.channelInfo != null && message.hasOwnProperty("channelInfo")) {
            let error = $root.ChannelInfo.verify(message.channelInfo);
            if (error)
                return "channelInfo." + error;
        }
        if (message.subscriberInfo != null && message.hasOwnProperty("subscriberInfo")) {
            let error = $root.SubscriberInfo.verify(message.subscriberInfo);
            if (error)
                return "subscriberInfo." + error;
        }
        if (message.msgTime != null && message.hasOwnProperty("msgTime"))
            if (!$util.isInteger(message.msgTime) && !(message.msgTime && $util.isInteger(message.msgTime.low) && $util.isInteger(message.msgTime.high)))
                return "msgTime: integer|Long expected";
        if (message.msg != null && message.hasOwnProperty("msg"))
            if (!$util.isString(message.msg))
                return "msg: string expected";
        if (message.channelNoticeMsg != null && message.hasOwnProperty("channelNoticeMsg")) {
            let error = $root.ChannelNoticeMsg.verify(message.channelNoticeMsg);
            if (error)
                return "channelNoticeMsg." + error;
        }
        return null;
    };

    /**
     * Creates a ChannelEventMessage message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ChannelEventMessage
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ChannelEventMessage} ChannelEventMessage
     */
    ChannelEventMessage.fromObject = function fromObject(object) {
        if (object instanceof $root.ChannelEventMessage)
            return object;
        let message = new $root.ChannelEventMessage();
        if (object.msgId != null)
            if ($util.Long)
                (message.msgId = $util.Long.fromValue(object.msgId)).unsigned = false;
            else if (typeof object.msgId === "string")
                message.msgId = parseInt(object.msgId, 10);
            else if (typeof object.msgId === "number")
                message.msgId = object.msgId;
            else if (typeof object.msgId === "object")
                message.msgId = new $util.LongBits(object.msgId.low >>> 0, object.msgId.high >>> 0).toNumber();
        switch (object.eventType) {
        default:
            if (typeof object.eventType === "number") {
                message.eventType = object.eventType;
                break;
            }
            break;
        case "FORCE_INIT":
        case 0:
            message.eventType = 0;
            break;
        case "CHANNEL_EVENT":
        case 1:
            message.eventType = 1;
            break;
        case "CHANNEL_SUBSCRIBER_EVENT":
        case 2:
            message.eventType = 2;
            break;
        }
        if (object.channelId != null)
            if ($util.Long)
                (message.channelId = $util.Long.fromValue(object.channelId)).unsigned = false;
            else if (typeof object.channelId === "string")
                message.channelId = parseInt(object.channelId, 10);
            else if (typeof object.channelId === "number")
                message.channelId = object.channelId;
            else if (typeof object.channelId === "object")
                message.channelId = new $util.LongBits(object.channelId.low >>> 0, object.channelId.high >>> 0).toNumber();
        if (object.channelInfo != null) {
            if (typeof object.channelInfo !== "object")
                throw TypeError(".ChannelEventMessage.channelInfo: object expected");
            message.channelInfo = $root.ChannelInfo.fromObject(object.channelInfo);
        }
        if (object.subscriberInfo != null) {
            if (typeof object.subscriberInfo !== "object")
                throw TypeError(".ChannelEventMessage.subscriberInfo: object expected");
            message.subscriberInfo = $root.SubscriberInfo.fromObject(object.subscriberInfo);
        }
        if (object.msgTime != null)
            if ($util.Long)
                (message.msgTime = $util.Long.fromValue(object.msgTime)).unsigned = false;
            else if (typeof object.msgTime === "string")
                message.msgTime = parseInt(object.msgTime, 10);
            else if (typeof object.msgTime === "number")
                message.msgTime = object.msgTime;
            else if (typeof object.msgTime === "object")
                message.msgTime = new $util.LongBits(object.msgTime.low >>> 0, object.msgTime.high >>> 0).toNumber();
        if (object.msg != null)
            message.msg = String(object.msg);
        if (object.channelNoticeMsg != null) {
            if (typeof object.channelNoticeMsg !== "object")
                throw TypeError(".ChannelEventMessage.channelNoticeMsg: object expected");
            message.channelNoticeMsg = $root.ChannelNoticeMsg.fromObject(object.channelNoticeMsg);
        }
        return message;
    };

    /**
     * Creates a plain object from a ChannelEventMessage message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ChannelEventMessage
     * @static
     * @param {ChannelEventMessage} message ChannelEventMessage
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ChannelEventMessage.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.msgId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.msgId = options.longs === String ? "0" : 0;
            object.eventType = options.enums === String ? "FORCE_INIT" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.channelId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.channelId = options.longs === String ? "0" : 0;
            object.channelInfo = null;
            object.subscriberInfo = null;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.msgTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.msgTime = options.longs === String ? "0" : 0;
            object.msg = "";
            object.channelNoticeMsg = null;
        }
        if (message.msgId != null && message.hasOwnProperty("msgId"))
            if (typeof message.msgId === "number")
                object.msgId = options.longs === String ? String(message.msgId) : message.msgId;
            else
                object.msgId = options.longs === String ? $util.Long.prototype.toString.call(message.msgId) : options.longs === Number ? new $util.LongBits(message.msgId.low >>> 0, message.msgId.high >>> 0).toNumber() : message.msgId;
        if (message.eventType != null && message.hasOwnProperty("eventType"))
            object.eventType = options.enums === String ? $root.ChannelEventType[message.eventType] === undefined ? message.eventType : $root.ChannelEventType[message.eventType] : message.eventType;
        if (message.channelId != null && message.hasOwnProperty("channelId"))
            if (typeof message.channelId === "number")
                object.channelId = options.longs === String ? String(message.channelId) : message.channelId;
            else
                object.channelId = options.longs === String ? $util.Long.prototype.toString.call(message.channelId) : options.longs === Number ? new $util.LongBits(message.channelId.low >>> 0, message.channelId.high >>> 0).toNumber() : message.channelId;
        if (message.channelInfo != null && message.hasOwnProperty("channelInfo"))
            object.channelInfo = $root.ChannelInfo.toObject(message.channelInfo, options);
        if (message.subscriberInfo != null && message.hasOwnProperty("subscriberInfo"))
            object.subscriberInfo = $root.SubscriberInfo.toObject(message.subscriberInfo, options);
        if (message.msgTime != null && message.hasOwnProperty("msgTime"))
            if (typeof message.msgTime === "number")
                object.msgTime = options.longs === String ? String(message.msgTime) : message.msgTime;
            else
                object.msgTime = options.longs === String ? $util.Long.prototype.toString.call(message.msgTime) : options.longs === Number ? new $util.LongBits(message.msgTime.low >>> 0, message.msgTime.high >>> 0).toNumber() : message.msgTime;
        if (message.msg != null && message.hasOwnProperty("msg"))
            object.msg = message.msg;
        if (message.channelNoticeMsg != null && message.hasOwnProperty("channelNoticeMsg"))
            object.channelNoticeMsg = $root.ChannelNoticeMsg.toObject(message.channelNoticeMsg, options);
        return object;
    };

    /**
     * Converts this ChannelEventMessage to JSON.
     * @function toJSON
     * @memberof ChannelEventMessage
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ChannelEventMessage.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ChannelEventMessage
     * @function getTypeUrl
     * @memberof ChannelEventMessage
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ChannelEventMessage.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/ChannelEventMessage";
    };

    return ChannelEventMessage;
})();

export const ChannelNoticeMsg = $root.ChannelNoticeMsg = (() => {

    /**
     * Properties of a ChannelNoticeMsg.
     * @exports IChannelNoticeMsg
     * @interface IChannelNoticeMsg
     * @property {boolean|null} [isNotice] ChannelNoticeMsg isNotice
     * @property {string|null} [noticeMsg] ChannelNoticeMsg noticeMsg
     * @property {number|Long|null} [unReadNum] ChannelNoticeMsg unReadNum
     */

    /**
     * Constructs a new ChannelNoticeMsg.
     * @exports ChannelNoticeMsg
     * @classdesc Represents a ChannelNoticeMsg.
     * @implements IChannelNoticeMsg
     * @constructor
     * @param {IChannelNoticeMsg=} [properties] Properties to set
     */
    function ChannelNoticeMsg(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ChannelNoticeMsg isNotice.
     * @member {boolean} isNotice
     * @memberof ChannelNoticeMsg
     * @instance
     */
    ChannelNoticeMsg.prototype.isNotice = false;

    /**
     * ChannelNoticeMsg noticeMsg.
     * @member {string} noticeMsg
     * @memberof ChannelNoticeMsg
     * @instance
     */
    ChannelNoticeMsg.prototype.noticeMsg = "";

    /**
     * ChannelNoticeMsg unReadNum.
     * @member {number|Long} unReadNum
     * @memberof ChannelNoticeMsg
     * @instance
     */
    ChannelNoticeMsg.prototype.unReadNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new ChannelNoticeMsg instance using the specified properties.
     * @function create
     * @memberof ChannelNoticeMsg
     * @static
     * @param {IChannelNoticeMsg=} [properties] Properties to set
     * @returns {ChannelNoticeMsg} ChannelNoticeMsg instance
     */
    ChannelNoticeMsg.create = function create(properties) {
        return new ChannelNoticeMsg(properties);
    };

    /**
     * Encodes the specified ChannelNoticeMsg message. Does not implicitly {@link ChannelNoticeMsg.verify|verify} messages.
     * @function encode
     * @memberof ChannelNoticeMsg
     * @static
     * @param {IChannelNoticeMsg} message ChannelNoticeMsg message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ChannelNoticeMsg.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.isNotice != null && Object.hasOwnProperty.call(message, "isNotice"))
            writer.uint32(/* id 1, wireType 0 =*/8).bool(message.isNotice);
        if (message.noticeMsg != null && Object.hasOwnProperty.call(message, "noticeMsg"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.noticeMsg);
        if (message.unReadNum != null && Object.hasOwnProperty.call(message, "unReadNum"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.unReadNum);
        return writer;
    };

    /**
     * Encodes the specified ChannelNoticeMsg message, length delimited. Does not implicitly {@link ChannelNoticeMsg.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ChannelNoticeMsg
     * @static
     * @param {IChannelNoticeMsg} message ChannelNoticeMsg message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ChannelNoticeMsg.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ChannelNoticeMsg message from the specified reader or buffer.
     * @function decode
     * @memberof ChannelNoticeMsg
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ChannelNoticeMsg} ChannelNoticeMsg
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ChannelNoticeMsg.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.ChannelNoticeMsg();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.isNotice = reader.bool();
                    break;
                }
            case 2: {
                    message.noticeMsg = reader.string();
                    break;
                }
            case 3: {
                    message.unReadNum = reader.int64();
                    break;
                }
            default:
                reader.skipType(tag & 7);
                break;
            }
        }
        return message;
    };

    /**
     * Decodes a ChannelNoticeMsg message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ChannelNoticeMsg
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ChannelNoticeMsg} ChannelNoticeMsg
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ChannelNoticeMsg.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ChannelNoticeMsg message.
     * @function verify
     * @memberof ChannelNoticeMsg
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ChannelNoticeMsg.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.isNotice != null && message.hasOwnProperty("isNotice"))
            if (typeof message.isNotice !== "boolean")
                return "isNotice: boolean expected";
        if (message.noticeMsg != null && message.hasOwnProperty("noticeMsg"))
            if (!$util.isString(message.noticeMsg))
                return "noticeMsg: string expected";
        if (message.unReadNum != null && message.hasOwnProperty("unReadNum"))
            if (!$util.isInteger(message.unReadNum) && !(message.unReadNum && $util.isInteger(message.unReadNum.low) && $util.isInteger(message.unReadNum.high)))
                return "unReadNum: integer|Long expected";
        return null;
    };

    /**
     * Creates a ChannelNoticeMsg message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ChannelNoticeMsg
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ChannelNoticeMsg} ChannelNoticeMsg
     */
    ChannelNoticeMsg.fromObject = function fromObject(object) {
        if (object instanceof $root.ChannelNoticeMsg)
            return object;
        let message = new $root.ChannelNoticeMsg();
        if (object.isNotice != null)
            message.isNotice = Boolean(object.isNotice);
        if (object.noticeMsg != null)
            message.noticeMsg = String(object.noticeMsg);
        if (object.unReadNum != null)
            if ($util.Long)
                (message.unReadNum = $util.Long.fromValue(object.unReadNum)).unsigned = false;
            else if (typeof object.unReadNum === "string")
                message.unReadNum = parseInt(object.unReadNum, 10);
            else if (typeof object.unReadNum === "number")
                message.unReadNum = object.unReadNum;
            else if (typeof object.unReadNum === "object")
                message.unReadNum = new $util.LongBits(object.unReadNum.low >>> 0, object.unReadNum.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a ChannelNoticeMsg message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ChannelNoticeMsg
     * @static
     * @param {ChannelNoticeMsg} message ChannelNoticeMsg
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ChannelNoticeMsg.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.isNotice = false;
            object.noticeMsg = "";
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.unReadNum = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.unReadNum = options.longs === String ? "0" : 0;
        }
        if (message.isNotice != null && message.hasOwnProperty("isNotice"))
            object.isNotice = message.isNotice;
        if (message.noticeMsg != null && message.hasOwnProperty("noticeMsg"))
            object.noticeMsg = message.noticeMsg;
        if (message.unReadNum != null && message.hasOwnProperty("unReadNum"))
            if (typeof message.unReadNum === "number")
                object.unReadNum = options.longs === String ? String(message.unReadNum) : message.unReadNum;
            else
                object.unReadNum = options.longs === String ? $util.Long.prototype.toString.call(message.unReadNum) : options.longs === Number ? new $util.LongBits(message.unReadNum.low >>> 0, message.unReadNum.high >>> 0).toNumber() : message.unReadNum;
        return object;
    };

    /**
     * Converts this ChannelNoticeMsg to JSON.
     * @function toJSON
     * @memberof ChannelNoticeMsg
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ChannelNoticeMsg.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ChannelNoticeMsg
     * @function getTypeUrl
     * @memberof ChannelNoticeMsg
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ChannelNoticeMsg.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/ChannelNoticeMsg";
    };

    return ChannelNoticeMsg;
})();

/**
 * ChannelReqStatus enum.
 * @exports ChannelReqStatus
 * @enum {number}
 * @property {number} CHANNEL_CHECKING=0 CHANNEL_CHECKING value
 * @property {number} CHANNEL_AGREE=1 CHANNEL_AGREE value
 * @property {number} CHANNEL_REFUSE=2 CHANNEL_REFUSE value
 */
export const ChannelReqStatus = $root.ChannelReqStatus = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "CHANNEL_CHECKING"] = 0;
    values[valuesById[1] = "CHANNEL_AGREE"] = 1;
    values[valuesById[2] = "CHANNEL_REFUSE"] = 2;
    return values;
})();

export { $root as default };
