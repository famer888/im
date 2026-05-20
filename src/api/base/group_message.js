/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const GroupReqMsgDto = $root.GroupReqMsgDto = (() => {

    /**
     * Properties of a GroupReqMsgDto.
     * @exports IGroupReqMsgDto
     * @interface IGroupReqMsgDto
     * @property {number|Long|null} [sendUid] GroupReqMsgDto sendUid
     * @property {number|Long|null} [receiveUid] GroupReqMsgDto receiveUid
     * @property {number|Long|null} [groupReqId] GroupReqMsgDto groupReqId
     * @property {number|Long|null} [groupId] GroupReqMsgDto groupId
     * @property {string|null} [groupName] GroupReqMsgDto groupName
     * @property {string|null} [pic] GroupReqMsgDto pic
     * @property {string|null} [msg] GroupReqMsgDto msg
     * @property {GroupReqType|null} [groupReqType] GroupReqMsgDto groupReqType
     * @property {GroupReqStatus|null} [groupReqStatus] GroupReqMsgDto groupReqStatus
     * @property {number|Long|null} [updateTime] GroupReqMsgDto updateTime
     * @property {boolean|null} [bfJoinCheck] GroupReqMsgDto bfJoinCheck
     * @property {IUserBase|null} [targetUser] GroupReqMsgDto targetUser
     * @property {IUserBase|null} [checkUser] GroupReqMsgDto checkUser
     * @property {IUserBase|null} [fromUser] GroupReqMsgDto fromUser
     * @property {IGroupMemberBase|null} [groupMember] GroupReqMsgDto groupMember
     * @property {number|Long|null} [unReadNum] GroupReqMsgDto unReadNum
     * @property {GroupHandleType|null} [handleType] GroupReqMsgDto handleType
     * @property {string|null} [rId] GroupReqMsgDto rId
     * @property {boolean|null} [groupShutup] GroupReqMsgDto groupShutup
     * @property {IGroupNoticeBase|null} [groupNotice] GroupReqMsgDto groupNotice
     * @property {GroupMemberType|null} [checkUserType] GroupReqMsgDto checkUserType
     * @property {boolean|null} [bfGroupReadCancel] GroupReqMsgDto bfGroupReadCancel
     * @property {number|null} [groupMsgCancelTime] GroupReqMsgDto groupMsgCancelTime
     * @property {boolean|null} [bfAll] GroupReqMsgDto bfAll
     */

    /**
     * Constructs a new GroupReqMsgDto.
     * @exports GroupReqMsgDto
     * @classdesc Represents a GroupReqMsgDto.
     * @implements IGroupReqMsgDto
     * @constructor
     * @param {IGroupReqMsgDto=} [properties] Properties to set
     */
    function GroupReqMsgDto(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupReqMsgDto sendUid.
     * @member {number|Long} sendUid
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.sendUid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupReqMsgDto receiveUid.
     * @member {number|Long} receiveUid
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.receiveUid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupReqMsgDto groupReqId.
     * @member {number|Long} groupReqId
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.groupReqId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupReqMsgDto groupId.
     * @member {number|Long} groupId
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.groupId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupReqMsgDto groupName.
     * @member {string} groupName
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.groupName = "";

    /**
     * GroupReqMsgDto pic.
     * @member {string} pic
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.pic = "";

    /**
     * GroupReqMsgDto msg.
     * @member {string} msg
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.msg = "";

    /**
     * GroupReqMsgDto groupReqType.
     * @member {GroupReqType} groupReqType
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.groupReqType = 0;

    /**
     * GroupReqMsgDto groupReqStatus.
     * @member {GroupReqStatus} groupReqStatus
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.groupReqStatus = 0;

    /**
     * GroupReqMsgDto updateTime.
     * @member {number|Long} updateTime
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.updateTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupReqMsgDto bfJoinCheck.
     * @member {boolean} bfJoinCheck
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.bfJoinCheck = false;

    /**
     * GroupReqMsgDto targetUser.
     * @member {IUserBase|null|undefined} targetUser
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.targetUser = null;

    /**
     * GroupReqMsgDto checkUser.
     * @member {IUserBase|null|undefined} checkUser
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.checkUser = null;

    /**
     * GroupReqMsgDto fromUser.
     * @member {IUserBase|null|undefined} fromUser
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.fromUser = null;

    /**
     * GroupReqMsgDto groupMember.
     * @member {IGroupMemberBase|null|undefined} groupMember
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.groupMember = null;

    /**
     * GroupReqMsgDto unReadNum.
     * @member {number|Long} unReadNum
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.unReadNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupReqMsgDto handleType.
     * @member {GroupHandleType} handleType
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.handleType = 0;

    /**
     * GroupReqMsgDto rId.
     * @member {string} rId
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.rId = "";

    /**
     * GroupReqMsgDto groupShutup.
     * @member {boolean} groupShutup
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.groupShutup = false;

    /**
     * GroupReqMsgDto groupNotice.
     * @member {IGroupNoticeBase|null|undefined} groupNotice
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.groupNotice = null;

    /**
     * GroupReqMsgDto checkUserType.
     * @member {GroupMemberType} checkUserType
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.checkUserType = 0;

    /**
     * GroupReqMsgDto bfGroupReadCancel.
     * @member {boolean} bfGroupReadCancel
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.bfGroupReadCancel = false;

    /**
     * GroupReqMsgDto groupMsgCancelTime.
     * @member {number} groupMsgCancelTime
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.groupMsgCancelTime = 0;

    /**
     * GroupReqMsgDto bfAll.
     * @member {boolean} bfAll
     * @memberof GroupReqMsgDto
     * @instance
     */
    GroupReqMsgDto.prototype.bfAll = false;

    /**
     * Creates a new GroupReqMsgDto instance using the specified properties.
     * @function create
     * @memberof GroupReqMsgDto
     * @static
     * @param {IGroupReqMsgDto=} [properties] Properties to set
     * @returns {GroupReqMsgDto} GroupReqMsgDto instance
     */
    GroupReqMsgDto.create = function create(properties) {
        return new GroupReqMsgDto(properties);
    };

    /**
     * Encodes the specified GroupReqMsgDto message. Does not implicitly {@link GroupReqMsgDto.verify|verify} messages.
     * @function encode
     * @memberof GroupReqMsgDto
     * @static
     * @param {IGroupReqMsgDto} message GroupReqMsgDto message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupReqMsgDto.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.sendUid != null && Object.hasOwnProperty.call(message, "sendUid"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.sendUid);
        if (message.receiveUid != null && Object.hasOwnProperty.call(message, "receiveUid"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.receiveUid);
        if (message.groupReqId != null && Object.hasOwnProperty.call(message, "groupReqId"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.groupReqId);
        if (message.groupId != null && Object.hasOwnProperty.call(message, "groupId"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.groupId);
        if (message.groupName != null && Object.hasOwnProperty.call(message, "groupName"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.groupName);
        if (message.pic != null && Object.hasOwnProperty.call(message, "pic"))
            writer.uint32(/* id 6, wireType 2 =*/50).string(message.pic);
        if (message.msg != null && Object.hasOwnProperty.call(message, "msg"))
            writer.uint32(/* id 7, wireType 2 =*/58).string(message.msg);
        if (message.groupReqType != null && Object.hasOwnProperty.call(message, "groupReqType"))
            writer.uint32(/* id 8, wireType 0 =*/64).int32(message.groupReqType);
        if (message.groupReqStatus != null && Object.hasOwnProperty.call(message, "groupReqStatus"))
            writer.uint32(/* id 9, wireType 0 =*/72).int32(message.groupReqStatus);
        if (message.updateTime != null && Object.hasOwnProperty.call(message, "updateTime"))
            writer.uint32(/* id 10, wireType 0 =*/80).int64(message.updateTime);
        if (message.bfJoinCheck != null && Object.hasOwnProperty.call(message, "bfJoinCheck"))
            writer.uint32(/* id 11, wireType 0 =*/88).bool(message.bfJoinCheck);
        if (message.targetUser != null && Object.hasOwnProperty.call(message, "targetUser"))
            $root.UserBase.encode(message.targetUser, writer.uint32(/* id 12, wireType 2 =*/98).fork()).ldelim();
        if (message.checkUser != null && Object.hasOwnProperty.call(message, "checkUser"))
            $root.UserBase.encode(message.checkUser, writer.uint32(/* id 13, wireType 2 =*/106).fork()).ldelim();
        if (message.fromUser != null && Object.hasOwnProperty.call(message, "fromUser"))
            $root.UserBase.encode(message.fromUser, writer.uint32(/* id 14, wireType 2 =*/114).fork()).ldelim();
        if (message.groupMember != null && Object.hasOwnProperty.call(message, "groupMember"))
            $root.GroupMemberBase.encode(message.groupMember, writer.uint32(/* id 15, wireType 2 =*/122).fork()).ldelim();
        if (message.unReadNum != null && Object.hasOwnProperty.call(message, "unReadNum"))
            writer.uint32(/* id 16, wireType 0 =*/128).int64(message.unReadNum);
        if (message.handleType != null && Object.hasOwnProperty.call(message, "handleType"))
            writer.uint32(/* id 17, wireType 0 =*/136).int32(message.handleType);
        if (message.rId != null && Object.hasOwnProperty.call(message, "rId"))
            writer.uint32(/* id 18, wireType 2 =*/146).string(message.rId);
        if (message.groupShutup != null && Object.hasOwnProperty.call(message, "groupShutup"))
            writer.uint32(/* id 19, wireType 0 =*/152).bool(message.groupShutup);
        if (message.groupNotice != null && Object.hasOwnProperty.call(message, "groupNotice"))
            $root.GroupNoticeBase.encode(message.groupNotice, writer.uint32(/* id 20, wireType 2 =*/162).fork()).ldelim();
        if (message.checkUserType != null && Object.hasOwnProperty.call(message, "checkUserType"))
            writer.uint32(/* id 21, wireType 0 =*/168).int32(message.checkUserType);
        if (message.bfGroupReadCancel != null && Object.hasOwnProperty.call(message, "bfGroupReadCancel"))
            writer.uint32(/* id 22, wireType 0 =*/176).bool(message.bfGroupReadCancel);
        if (message.groupMsgCancelTime != null && Object.hasOwnProperty.call(message, "groupMsgCancelTime"))
            writer.uint32(/* id 23, wireType 0 =*/184).int32(message.groupMsgCancelTime);
        if (message.bfAll != null && Object.hasOwnProperty.call(message, "bfAll"))
            writer.uint32(/* id 24, wireType 0 =*/192).bool(message.bfAll);
        return writer;
    };

    /**
     * Encodes the specified GroupReqMsgDto message, length delimited. Does not implicitly {@link GroupReqMsgDto.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupReqMsgDto
     * @static
     * @param {IGroupReqMsgDto} message GroupReqMsgDto message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupReqMsgDto.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupReqMsgDto message from the specified reader or buffer.
     * @function decode
     * @memberof GroupReqMsgDto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupReqMsgDto} GroupReqMsgDto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupReqMsgDto.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupReqMsgDto();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.sendUid = reader.int64();
                    break;
                }
            case 2: {
                    message.receiveUid = reader.int64();
                    break;
                }
            case 3: {
                    message.groupReqId = reader.int64();
                    break;
                }
            case 4: {
                    message.groupId = reader.int64();
                    break;
                }
            case 5: {
                    message.groupName = reader.string();
                    break;
                }
            case 6: {
                    message.pic = reader.string();
                    break;
                }
            case 7: {
                    message.msg = reader.string();
                    break;
                }
            case 8: {
                    message.groupReqType = reader.int32();
                    break;
                }
            case 9: {
                    message.groupReqStatus = reader.int32();
                    break;
                }
            case 10: {
                    message.updateTime = reader.int64();
                    break;
                }
            case 11: {
                    message.bfJoinCheck = reader.bool();
                    break;
                }
            case 12: {
                    message.targetUser = $root.UserBase.decode(reader, reader.uint32());
                    break;
                }
            case 13: {
                    message.checkUser = $root.UserBase.decode(reader, reader.uint32());
                    break;
                }
            case 14: {
                    message.fromUser = $root.UserBase.decode(reader, reader.uint32());
                    break;
                }
            case 15: {
                    message.groupMember = $root.GroupMemberBase.decode(reader, reader.uint32());
                    break;
                }
            case 16: {
                    message.unReadNum = reader.int64();
                    break;
                }
            case 17: {
                    message.handleType = reader.int32();
                    break;
                }
            case 18: {
                    message.rId = reader.string();
                    break;
                }
            case 19: {
                    message.groupShutup = reader.bool();
                    break;
                }
            case 20: {
                    message.groupNotice = $root.GroupNoticeBase.decode(reader, reader.uint32());
                    break;
                }
            case 21: {
                    message.checkUserType = reader.int32();
                    break;
                }
            case 22: {
                    message.bfGroupReadCancel = reader.bool();
                    break;
                }
            case 23: {
                    message.groupMsgCancelTime = reader.int32();
                    break;
                }
            case 24: {
                    message.bfAll = reader.bool();
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
     * Decodes a GroupReqMsgDto message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupReqMsgDto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupReqMsgDto} GroupReqMsgDto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupReqMsgDto.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupReqMsgDto message.
     * @function verify
     * @memberof GroupReqMsgDto
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupReqMsgDto.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.sendUid != null && message.hasOwnProperty("sendUid"))
            if (!$util.isInteger(message.sendUid) && !(message.sendUid && $util.isInteger(message.sendUid.low) && $util.isInteger(message.sendUid.high)))
                return "sendUid: integer|Long expected";
        if (message.receiveUid != null && message.hasOwnProperty("receiveUid"))
            if (!$util.isInteger(message.receiveUid) && !(message.receiveUid && $util.isInteger(message.receiveUid.low) && $util.isInteger(message.receiveUid.high)))
                return "receiveUid: integer|Long expected";
        if (message.groupReqId != null && message.hasOwnProperty("groupReqId"))
            if (!$util.isInteger(message.groupReqId) && !(message.groupReqId && $util.isInteger(message.groupReqId.low) && $util.isInteger(message.groupReqId.high)))
                return "groupReqId: integer|Long expected";
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (!$util.isInteger(message.groupId) && !(message.groupId && $util.isInteger(message.groupId.low) && $util.isInteger(message.groupId.high)))
                return "groupId: integer|Long expected";
        if (message.groupName != null && message.hasOwnProperty("groupName"))
            if (!$util.isString(message.groupName))
                return "groupName: string expected";
        if (message.pic != null && message.hasOwnProperty("pic"))
            if (!$util.isString(message.pic))
                return "pic: string expected";
        if (message.msg != null && message.hasOwnProperty("msg"))
            if (!$util.isString(message.msg))
                return "msg: string expected";
        if (message.groupReqType != null && message.hasOwnProperty("groupReqType"))
            switch (message.groupReqType) {
            default:
                return "groupReqType: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
            case 16:
            case 17:
            case 18:
                break;
            }
        if (message.groupReqStatus != null && message.hasOwnProperty("groupReqStatus"))
            switch (message.groupReqStatus) {
            default:
                return "groupReqStatus: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
                break;
            }
        if (message.updateTime != null && message.hasOwnProperty("updateTime"))
            if (!$util.isInteger(message.updateTime) && !(message.updateTime && $util.isInteger(message.updateTime.low) && $util.isInteger(message.updateTime.high)))
                return "updateTime: integer|Long expected";
        if (message.bfJoinCheck != null && message.hasOwnProperty("bfJoinCheck"))
            if (typeof message.bfJoinCheck !== "boolean")
                return "bfJoinCheck: boolean expected";
        if (message.targetUser != null && message.hasOwnProperty("targetUser")) {
            let error = $root.UserBase.verify(message.targetUser);
            if (error)
                return "targetUser." + error;
        }
        if (message.checkUser != null && message.hasOwnProperty("checkUser")) {
            let error = $root.UserBase.verify(message.checkUser);
            if (error)
                return "checkUser." + error;
        }
        if (message.fromUser != null && message.hasOwnProperty("fromUser")) {
            let error = $root.UserBase.verify(message.fromUser);
            if (error)
                return "fromUser." + error;
        }
        if (message.groupMember != null && message.hasOwnProperty("groupMember")) {
            let error = $root.GroupMemberBase.verify(message.groupMember);
            if (error)
                return "groupMember." + error;
        }
        if (message.unReadNum != null && message.hasOwnProperty("unReadNum"))
            if (!$util.isInteger(message.unReadNum) && !(message.unReadNum && $util.isInteger(message.unReadNum.low) && $util.isInteger(message.unReadNum.high)))
                return "unReadNum: integer|Long expected";
        if (message.handleType != null && message.hasOwnProperty("handleType"))
            switch (message.handleType) {
            default:
                return "handleType: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
                break;
            }
        if (message.rId != null && message.hasOwnProperty("rId"))
            if (!$util.isString(message.rId))
                return "rId: string expected";
        if (message.groupShutup != null && message.hasOwnProperty("groupShutup"))
            if (typeof message.groupShutup !== "boolean")
                return "groupShutup: boolean expected";
        if (message.groupNotice != null && message.hasOwnProperty("groupNotice")) {
            let error = $root.GroupNoticeBase.verify(message.groupNotice);
            if (error)
                return "groupNotice." + error;
        }
        if (message.checkUserType != null && message.hasOwnProperty("checkUserType"))
            switch (message.checkUserType) {
            default:
                return "checkUserType: enum value expected";
            case 0:
            case 1:
            case 2:
                break;
            }
        if (message.bfGroupReadCancel != null && message.hasOwnProperty("bfGroupReadCancel"))
            if (typeof message.bfGroupReadCancel !== "boolean")
                return "bfGroupReadCancel: boolean expected";
        if (message.groupMsgCancelTime != null && message.hasOwnProperty("groupMsgCancelTime"))
            if (!$util.isInteger(message.groupMsgCancelTime))
                return "groupMsgCancelTime: integer expected";
        if (message.bfAll != null && message.hasOwnProperty("bfAll"))
            if (typeof message.bfAll !== "boolean")
                return "bfAll: boolean expected";
        return null;
    };

    /**
     * Creates a GroupReqMsgDto message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupReqMsgDto
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupReqMsgDto} GroupReqMsgDto
     */
    GroupReqMsgDto.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupReqMsgDto)
            return object;
        let message = new $root.GroupReqMsgDto();
        if (object.sendUid != null)
            if ($util.Long)
                (message.sendUid = $util.Long.fromValue(object.sendUid)).unsigned = false;
            else if (typeof object.sendUid === "string")
                message.sendUid = parseInt(object.sendUid, 10);
            else if (typeof object.sendUid === "number")
                message.sendUid = object.sendUid;
            else if (typeof object.sendUid === "object")
                message.sendUid = new $util.LongBits(object.sendUid.low >>> 0, object.sendUid.high >>> 0).toNumber();
        if (object.receiveUid != null)
            if ($util.Long)
                (message.receiveUid = $util.Long.fromValue(object.receiveUid)).unsigned = false;
            else if (typeof object.receiveUid === "string")
                message.receiveUid = parseInt(object.receiveUid, 10);
            else if (typeof object.receiveUid === "number")
                message.receiveUid = object.receiveUid;
            else if (typeof object.receiveUid === "object")
                message.receiveUid = new $util.LongBits(object.receiveUid.low >>> 0, object.receiveUid.high >>> 0).toNumber();
        if (object.groupReqId != null)
            if ($util.Long)
                (message.groupReqId = $util.Long.fromValue(object.groupReqId)).unsigned = false;
            else if (typeof object.groupReqId === "string")
                message.groupReqId = parseInt(object.groupReqId, 10);
            else if (typeof object.groupReqId === "number")
                message.groupReqId = object.groupReqId;
            else if (typeof object.groupReqId === "object")
                message.groupReqId = new $util.LongBits(object.groupReqId.low >>> 0, object.groupReqId.high >>> 0).toNumber();
        if (object.groupId != null)
            if ($util.Long)
                (message.groupId = $util.Long.fromValue(object.groupId)).unsigned = false;
            else if (typeof object.groupId === "string")
                message.groupId = parseInt(object.groupId, 10);
            else if (typeof object.groupId === "number")
                message.groupId = object.groupId;
            else if (typeof object.groupId === "object")
                message.groupId = new $util.LongBits(object.groupId.low >>> 0, object.groupId.high >>> 0).toNumber();
        if (object.groupName != null)
            message.groupName = String(object.groupName);
        if (object.pic != null)
            message.pic = String(object.pic);
        if (object.msg != null)
            message.msg = String(object.msg);
        switch (object.groupReqType) {
        default:
            if (typeof object.groupReqType === "number") {
                message.groupReqType = object.groupReqType;
                break;
            }
            break;
        case "GROUP_TRANSFER":
        case 0:
            message.groupReqType = 0;
            break;
        case "GROUP_INVITE":
        case 1:
            message.groupReqType = 1;
            break;
        case "GROUP_QR_CODE":
        case 2:
            message.groupReqType = 2;
            break;
        case "GROUP_OWNER_CHECK_INVITE":
        case 3:
            message.groupReqType = 3;
            break;
        case "GROUP_OWNER_CHECK_QR_CODE":
        case 4:
            message.groupReqType = 4;
            break;
        case "GROUP_MEMBER_CHECK":
        case 5:
            message.groupReqType = 5;
            break;
        case "GROUP_OWNER_REMOVE_MEMBER":
        case 6:
            message.groupReqType = 6;
            break;
        case "GROUP_MEMBER_EXIT":
        case 7:
            message.groupReqType = 7;
            break;
        case "GROUP_SET_ADMIN":
        case 8:
            message.groupReqType = 8;
            break;
        case "GROUP_CANCLE_ADMIN":
        case 9:
            message.groupReqType = 9;
            break;
        case "GROUP_ADMIN_UPDATE":
        case 10:
            message.groupReqType = 10;
            break;
        case "GROUP_IS_DISABLED":
        case 11:
            message.groupReqType = 11;
            break;
        case "GROUP_MEMBER_SHUTUP":
        case 12:
            message.groupReqType = 12;
            break;
        case "GROUP_IS_DISBANDED":
        case 13:
            message.groupReqType = 13;
            break;
        case "GROUP_LINK":
        case 14:
            message.groupReqType = 14;
            break;
        case "GROUP_ALIAS":
        case 15:
            message.groupReqType = 15;
            break;
        case "GROUP_IS_ENABLED":
        case 16:
            message.groupReqType = 16;
            break;
        case "GROUP_OBSERVE_ADD":
        case 17:
            message.groupReqType = 17;
            break;
        case "GROUP_OBSERVE_REMOVE":
        case 18:
            message.groupReqType = 18;
            break;
        }
        switch (object.groupReqStatus) {
        default:
            if (typeof object.groupReqStatus === "number") {
                message.groupReqStatus = object.groupReqStatus;
                break;
            }
            break;
        case "CHECKING":
        case 0:
            message.groupReqStatus = 0;
            break;
        case "AGREE":
        case 1:
            message.groupReqStatus = 1;
            break;
        case "REFUSE":
        case 2:
            message.groupReqStatus = 2;
            break;
        case "EXPIRE":
        case 3:
            message.groupReqStatus = 3;
            break;
        }
        if (object.updateTime != null)
            if ($util.Long)
                (message.updateTime = $util.Long.fromValue(object.updateTime)).unsigned = false;
            else if (typeof object.updateTime === "string")
                message.updateTime = parseInt(object.updateTime, 10);
            else if (typeof object.updateTime === "number")
                message.updateTime = object.updateTime;
            else if (typeof object.updateTime === "object")
                message.updateTime = new $util.LongBits(object.updateTime.low >>> 0, object.updateTime.high >>> 0).toNumber();
        if (object.bfJoinCheck != null)
            message.bfJoinCheck = Boolean(object.bfJoinCheck);
        if (object.targetUser != null) {
            if (typeof object.targetUser !== "object")
                throw TypeError(".GroupReqMsgDto.targetUser: object expected");
            message.targetUser = $root.UserBase.fromObject(object.targetUser);
        }
        if (object.checkUser != null) {
            if (typeof object.checkUser !== "object")
                throw TypeError(".GroupReqMsgDto.checkUser: object expected");
            message.checkUser = $root.UserBase.fromObject(object.checkUser);
        }
        if (object.fromUser != null) {
            if (typeof object.fromUser !== "object")
                throw TypeError(".GroupReqMsgDto.fromUser: object expected");
            message.fromUser = $root.UserBase.fromObject(object.fromUser);
        }
        if (object.groupMember != null) {
            if (typeof object.groupMember !== "object")
                throw TypeError(".GroupReqMsgDto.groupMember: object expected");
            message.groupMember = $root.GroupMemberBase.fromObject(object.groupMember);
        }
        if (object.unReadNum != null)
            if ($util.Long)
                (message.unReadNum = $util.Long.fromValue(object.unReadNum)).unsigned = false;
            else if (typeof object.unReadNum === "string")
                message.unReadNum = parseInt(object.unReadNum, 10);
            else if (typeof object.unReadNum === "number")
                message.unReadNum = object.unReadNum;
            else if (typeof object.unReadNum === "object")
                message.unReadNum = new $util.LongBits(object.unReadNum.low >>> 0, object.unReadNum.high >>> 0).toNumber();
        switch (object.handleType) {
        default:
            if (typeof object.handleType === "number") {
                message.handleType = object.handleType;
                break;
            }
            break;
        case "GROUP_REQ":
        case 0:
            message.handleType = 0;
            break;
        case "GROUP_NAME":
        case 1:
            message.handleType = 1;
            break;
        case "GROUP_PIC":
        case 2:
            message.handleType = 2;
            break;
        case "GROUP_MEMBER_NICKNAME":
        case 3:
            message.handleType = 3;
            break;
        case "GROUP_NOTICE":
        case 4:
            message.handleType = 4;
            break;
        case "GROUP_SHUTUP":
        case 5:
            message.handleType = 5;
            break;
        case "GROUP_READ_CANCEL":
        case 6:
            message.handleType = 6;
            break;
        }
        if (object.rId != null)
            message.rId = String(object.rId);
        if (object.groupShutup != null)
            message.groupShutup = Boolean(object.groupShutup);
        if (object.groupNotice != null) {
            if (typeof object.groupNotice !== "object")
                throw TypeError(".GroupReqMsgDto.groupNotice: object expected");
            message.groupNotice = $root.GroupNoticeBase.fromObject(object.groupNotice);
        }
        switch (object.checkUserType) {
        default:
            if (typeof object.checkUserType === "number") {
                message.checkUserType = object.checkUserType;
                break;
            }
            break;
        case "HOST":
        case 0:
            message.checkUserType = 0;
            break;
        case "MANAGE":
        case 1:
            message.checkUserType = 1;
            break;
        case "MEMBER":
        case 2:
            message.checkUserType = 2;
            break;
        }
        if (object.bfGroupReadCancel != null)
            message.bfGroupReadCancel = Boolean(object.bfGroupReadCancel);
        if (object.groupMsgCancelTime != null)
            message.groupMsgCancelTime = object.groupMsgCancelTime | 0;
        if (object.bfAll != null)
            message.bfAll = Boolean(object.bfAll);
        return message;
    };

    /**
     * Creates a plain object from a GroupReqMsgDto message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupReqMsgDto
     * @static
     * @param {GroupReqMsgDto} message GroupReqMsgDto
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupReqMsgDto.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.sendUid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.sendUid = options.longs === String ? "0" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.receiveUid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.receiveUid = options.longs === String ? "0" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.groupReqId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.groupReqId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.groupId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.groupId = options.longs === String ? "0" : 0;
            object.groupName = "";
            object.pic = "";
            object.msg = "";
            object.groupReqType = options.enums === String ? "GROUP_TRANSFER" : 0;
            object.groupReqStatus = options.enums === String ? "CHECKING" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.updateTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.updateTime = options.longs === String ? "0" : 0;
            object.bfJoinCheck = false;
            object.targetUser = null;
            object.checkUser = null;
            object.fromUser = null;
            object.groupMember = null;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.unReadNum = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.unReadNum = options.longs === String ? "0" : 0;
            object.handleType = options.enums === String ? "GROUP_REQ" : 0;
            object.rId = "";
            object.groupShutup = false;
            object.groupNotice = null;
            object.checkUserType = options.enums === String ? "HOST" : 0;
            object.bfGroupReadCancel = false;
            object.groupMsgCancelTime = 0;
            object.bfAll = false;
        }
        if (message.sendUid != null && message.hasOwnProperty("sendUid"))
            if (typeof message.sendUid === "number")
                object.sendUid = options.longs === String ? String(message.sendUid) : message.sendUid;
            else
                object.sendUid = options.longs === String ? $util.Long.prototype.toString.call(message.sendUid) : options.longs === Number ? new $util.LongBits(message.sendUid.low >>> 0, message.sendUid.high >>> 0).toNumber() : message.sendUid;
        if (message.receiveUid != null && message.hasOwnProperty("receiveUid"))
            if (typeof message.receiveUid === "number")
                object.receiveUid = options.longs === String ? String(message.receiveUid) : message.receiveUid;
            else
                object.receiveUid = options.longs === String ? $util.Long.prototype.toString.call(message.receiveUid) : options.longs === Number ? new $util.LongBits(message.receiveUid.low >>> 0, message.receiveUid.high >>> 0).toNumber() : message.receiveUid;
        if (message.groupReqId != null && message.hasOwnProperty("groupReqId"))
            if (typeof message.groupReqId === "number")
                object.groupReqId = options.longs === String ? String(message.groupReqId) : message.groupReqId;
            else
                object.groupReqId = options.longs === String ? $util.Long.prototype.toString.call(message.groupReqId) : options.longs === Number ? new $util.LongBits(message.groupReqId.low >>> 0, message.groupReqId.high >>> 0).toNumber() : message.groupReqId;
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (typeof message.groupId === "number")
                object.groupId = options.longs === String ? String(message.groupId) : message.groupId;
            else
                object.groupId = options.longs === String ? $util.Long.prototype.toString.call(message.groupId) : options.longs === Number ? new $util.LongBits(message.groupId.low >>> 0, message.groupId.high >>> 0).toNumber() : message.groupId;
        if (message.groupName != null && message.hasOwnProperty("groupName"))
            object.groupName = message.groupName;
        if (message.pic != null && message.hasOwnProperty("pic"))
            object.pic = message.pic;
        if (message.msg != null && message.hasOwnProperty("msg"))
            object.msg = message.msg;
        if (message.groupReqType != null && message.hasOwnProperty("groupReqType"))
            object.groupReqType = options.enums === String ? $root.GroupReqType[message.groupReqType] === undefined ? message.groupReqType : $root.GroupReqType[message.groupReqType] : message.groupReqType;
        if (message.groupReqStatus != null && message.hasOwnProperty("groupReqStatus"))
            object.groupReqStatus = options.enums === String ? $root.GroupReqStatus[message.groupReqStatus] === undefined ? message.groupReqStatus : $root.GroupReqStatus[message.groupReqStatus] : message.groupReqStatus;
        if (message.updateTime != null && message.hasOwnProperty("updateTime"))
            if (typeof message.updateTime === "number")
                object.updateTime = options.longs === String ? String(message.updateTime) : message.updateTime;
            else
                object.updateTime = options.longs === String ? $util.Long.prototype.toString.call(message.updateTime) : options.longs === Number ? new $util.LongBits(message.updateTime.low >>> 0, message.updateTime.high >>> 0).toNumber() : message.updateTime;
        if (message.bfJoinCheck != null && message.hasOwnProperty("bfJoinCheck"))
            object.bfJoinCheck = message.bfJoinCheck;
        if (message.targetUser != null && message.hasOwnProperty("targetUser"))
            object.targetUser = $root.UserBase.toObject(message.targetUser, options);
        if (message.checkUser != null && message.hasOwnProperty("checkUser"))
            object.checkUser = $root.UserBase.toObject(message.checkUser, options);
        if (message.fromUser != null && message.hasOwnProperty("fromUser"))
            object.fromUser = $root.UserBase.toObject(message.fromUser, options);
        if (message.groupMember != null && message.hasOwnProperty("groupMember"))
            object.groupMember = $root.GroupMemberBase.toObject(message.groupMember, options);
        if (message.unReadNum != null && message.hasOwnProperty("unReadNum"))
            if (typeof message.unReadNum === "number")
                object.unReadNum = options.longs === String ? String(message.unReadNum) : message.unReadNum;
            else
                object.unReadNum = options.longs === String ? $util.Long.prototype.toString.call(message.unReadNum) : options.longs === Number ? new $util.LongBits(message.unReadNum.low >>> 0, message.unReadNum.high >>> 0).toNumber() : message.unReadNum;
        if (message.handleType != null && message.hasOwnProperty("handleType"))
            object.handleType = options.enums === String ? $root.GroupHandleType[message.handleType] === undefined ? message.handleType : $root.GroupHandleType[message.handleType] : message.handleType;
        if (message.rId != null && message.hasOwnProperty("rId"))
            object.rId = message.rId;
        if (message.groupShutup != null && message.hasOwnProperty("groupShutup"))
            object.groupShutup = message.groupShutup;
        if (message.groupNotice != null && message.hasOwnProperty("groupNotice"))
            object.groupNotice = $root.GroupNoticeBase.toObject(message.groupNotice, options);
        if (message.checkUserType != null && message.hasOwnProperty("checkUserType"))
            object.checkUserType = options.enums === String ? $root.GroupMemberType[message.checkUserType] === undefined ? message.checkUserType : $root.GroupMemberType[message.checkUserType] : message.checkUserType;
        if (message.bfGroupReadCancel != null && message.hasOwnProperty("bfGroupReadCancel"))
            object.bfGroupReadCancel = message.bfGroupReadCancel;
        if (message.groupMsgCancelTime != null && message.hasOwnProperty("groupMsgCancelTime"))
            object.groupMsgCancelTime = message.groupMsgCancelTime;
        if (message.bfAll != null && message.hasOwnProperty("bfAll"))
            object.bfAll = message.bfAll;
        return object;
    };

    /**
     * Converts this GroupReqMsgDto to JSON.
     * @function toJSON
     * @memberof GroupReqMsgDto
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupReqMsgDto.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupReqMsgDto
     * @function getTypeUrl
     * @memberof GroupReqMsgDto
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupReqMsgDto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupReqMsgDto";
    };

    return GroupReqMsgDto;
})();

/**
 * GroupMsgType enum.
 * @exports GroupMsgType
 * @enum {number}
 * @property {number} GROUP_REQ_FORCE_INITIATE=0 GROUP_REQ_FORCE_INITIATE value
 * @property {number} GROUP_REQ_CREATE=1 GROUP_REQ_CREATE value
 * @property {number} GROUP_REQ_INITIATE=2 GROUP_REQ_INITIATE value
 * @property {number} GROUP_REQ_DESTROY=3 GROUP_REQ_DESTROY value
 * @property {number} GROUP_REQ_BROADCAST=4 GROUP_REQ_BROADCAST value
 * @property {number} GROUP_REQ_UNICAST=5 GROUP_REQ_UNICAST value
 * @property {number} GROUP_UPDATE=6 GROUP_UPDATE value
 * @property {number} GROUP_REQ_FORCE_DESTROY=7 GROUP_REQ_FORCE_DESTROY value
 */
export const GroupMsgType = $root.GroupMsgType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "GROUP_REQ_FORCE_INITIATE"] = 0;
    values[valuesById[1] = "GROUP_REQ_CREATE"] = 1;
    values[valuesById[2] = "GROUP_REQ_INITIATE"] = 2;
    values[valuesById[3] = "GROUP_REQ_DESTROY"] = 3;
    values[valuesById[4] = "GROUP_REQ_BROADCAST"] = 4;
    values[valuesById[5] = "GROUP_REQ_UNICAST"] = 5;
    values[valuesById[6] = "GROUP_UPDATE"] = 6;
    values[valuesById[7] = "GROUP_REQ_FORCE_DESTROY"] = 7;
    return values;
})();

/**
 * GroupEventType enum.
 * @exports GroupEventType
 * @enum {number}
 * @property {number} GROUP_EVENT_FORCE_INITIATE=0 GROUP_EVENT_FORCE_INITIATE value
 * @property {number} GROUP_EVENT_BROADCAST=1 GROUP_EVENT_BROADCAST value
 * @property {number} GROUP_EVENT_UNICAST=2 GROUP_EVENT_UNICAST value
 * @property {number} GROUP_EVENT_UPDATE=3 GROUP_EVENT_UPDATE value
 * @property {number} GROUP_EVENT_FORCE_DESTROY=4 GROUP_EVENT_FORCE_DESTROY value
 */
export const GroupEventType = $root.GroupEventType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "GROUP_EVENT_FORCE_INITIATE"] = 0;
    values[valuesById[1] = "GROUP_EVENT_BROADCAST"] = 1;
    values[valuesById[2] = "GROUP_EVENT_UNICAST"] = 2;
    values[valuesById[3] = "GROUP_EVENT_UPDATE"] = 3;
    values[valuesById[4] = "GROUP_EVENT_FORCE_DESTROY"] = 4;
    return values;
})();

export const CommonMsgDto = $root.CommonMsgDto = (() => {

    /**
     * Properties of a CommonMsgDto.
     * @exports ICommonMsgDto
     * @interface ICommonMsgDto
     * @property {number|Long|null} [msgId] CommonMsgDto msgId
     * @property {GroupEventType|null} [evenType] CommonMsgDto evenType
     * @property {GroupMsgType|null} [msgType] CommonMsgDto msgType
     * @property {string|null} [msg] CommonMsgDto msg
     * @property {IGroupBaseInfo|null} [groupBaseInfo] CommonMsgDto groupBaseInfo
     * @property {number|Long|null} [updateTime] CommonMsgDto updateTime
     */

    /**
     * Constructs a new CommonMsgDto.
     * @exports CommonMsgDto
     * @classdesc Represents a CommonMsgDto.
     * @implements ICommonMsgDto
     * @constructor
     * @param {ICommonMsgDto=} [properties] Properties to set
     */
    function CommonMsgDto(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CommonMsgDto msgId.
     * @member {number|Long} msgId
     * @memberof CommonMsgDto
     * @instance
     */
    CommonMsgDto.prototype.msgId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * CommonMsgDto evenType.
     * @member {GroupEventType} evenType
     * @memberof CommonMsgDto
     * @instance
     */
    CommonMsgDto.prototype.evenType = 0;

    /**
     * CommonMsgDto msgType.
     * @member {GroupMsgType} msgType
     * @memberof CommonMsgDto
     * @instance
     */
    CommonMsgDto.prototype.msgType = 0;

    /**
     * CommonMsgDto msg.
     * @member {string} msg
     * @memberof CommonMsgDto
     * @instance
     */
    CommonMsgDto.prototype.msg = "";

    /**
     * CommonMsgDto groupBaseInfo.
     * @member {IGroupBaseInfo|null|undefined} groupBaseInfo
     * @memberof CommonMsgDto
     * @instance
     */
    CommonMsgDto.prototype.groupBaseInfo = null;

    /**
     * CommonMsgDto updateTime.
     * @member {number|Long} updateTime
     * @memberof CommonMsgDto
     * @instance
     */
    CommonMsgDto.prototype.updateTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new CommonMsgDto instance using the specified properties.
     * @function create
     * @memberof CommonMsgDto
     * @static
     * @param {ICommonMsgDto=} [properties] Properties to set
     * @returns {CommonMsgDto} CommonMsgDto instance
     */
    CommonMsgDto.create = function create(properties) {
        return new CommonMsgDto(properties);
    };

    /**
     * Encodes the specified CommonMsgDto message. Does not implicitly {@link CommonMsgDto.verify|verify} messages.
     * @function encode
     * @memberof CommonMsgDto
     * @static
     * @param {ICommonMsgDto} message CommonMsgDto message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CommonMsgDto.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.msgId != null && Object.hasOwnProperty.call(message, "msgId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.msgId);
        if (message.evenType != null && Object.hasOwnProperty.call(message, "evenType"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.evenType);
        if (message.msgType != null && Object.hasOwnProperty.call(message, "msgType"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.msgType);
        if (message.msg != null && Object.hasOwnProperty.call(message, "msg"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.msg);
        if (message.groupBaseInfo != null && Object.hasOwnProperty.call(message, "groupBaseInfo"))
            $root.GroupBaseInfo.encode(message.groupBaseInfo, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
        if (message.updateTime != null && Object.hasOwnProperty.call(message, "updateTime"))
            writer.uint32(/* id 6, wireType 0 =*/48).int64(message.updateTime);
        return writer;
    };

    /**
     * Encodes the specified CommonMsgDto message, length delimited. Does not implicitly {@link CommonMsgDto.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CommonMsgDto
     * @static
     * @param {ICommonMsgDto} message CommonMsgDto message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CommonMsgDto.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CommonMsgDto message from the specified reader or buffer.
     * @function decode
     * @memberof CommonMsgDto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CommonMsgDto} CommonMsgDto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CommonMsgDto.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CommonMsgDto();
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
                    message.evenType = reader.int32();
                    break;
                }
            case 3: {
                    message.msgType = reader.int32();
                    break;
                }
            case 4: {
                    message.msg = reader.string();
                    break;
                }
            case 5: {
                    message.groupBaseInfo = $root.GroupBaseInfo.decode(reader, reader.uint32());
                    break;
                }
            case 6: {
                    message.updateTime = reader.int64();
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
     * Decodes a CommonMsgDto message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CommonMsgDto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CommonMsgDto} CommonMsgDto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CommonMsgDto.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CommonMsgDto message.
     * @function verify
     * @memberof CommonMsgDto
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CommonMsgDto.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.msgId != null && message.hasOwnProperty("msgId"))
            if (!$util.isInteger(message.msgId) && !(message.msgId && $util.isInteger(message.msgId.low) && $util.isInteger(message.msgId.high)))
                return "msgId: integer|Long expected";
        if (message.evenType != null && message.hasOwnProperty("evenType"))
            switch (message.evenType) {
            default:
                return "evenType: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
                break;
            }
        if (message.msgType != null && message.hasOwnProperty("msgType"))
            switch (message.msgType) {
            default:
                return "msgType: enum value expected";
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
        if (message.msg != null && message.hasOwnProperty("msg"))
            if (!$util.isString(message.msg))
                return "msg: string expected";
        if (message.groupBaseInfo != null && message.hasOwnProperty("groupBaseInfo")) {
            let error = $root.GroupBaseInfo.verify(message.groupBaseInfo);
            if (error)
                return "groupBaseInfo." + error;
        }
        if (message.updateTime != null && message.hasOwnProperty("updateTime"))
            if (!$util.isInteger(message.updateTime) && !(message.updateTime && $util.isInteger(message.updateTime.low) && $util.isInteger(message.updateTime.high)))
                return "updateTime: integer|Long expected";
        return null;
    };

    /**
     * Creates a CommonMsgDto message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CommonMsgDto
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CommonMsgDto} CommonMsgDto
     */
    CommonMsgDto.fromObject = function fromObject(object) {
        if (object instanceof $root.CommonMsgDto)
            return object;
        let message = new $root.CommonMsgDto();
        if (object.msgId != null)
            if ($util.Long)
                (message.msgId = $util.Long.fromValue(object.msgId)).unsigned = false;
            else if (typeof object.msgId === "string")
                message.msgId = parseInt(object.msgId, 10);
            else if (typeof object.msgId === "number")
                message.msgId = object.msgId;
            else if (typeof object.msgId === "object")
                message.msgId = new $util.LongBits(object.msgId.low >>> 0, object.msgId.high >>> 0).toNumber();
        switch (object.evenType) {
        default:
            if (typeof object.evenType === "number") {
                message.evenType = object.evenType;
                break;
            }
            break;
        case "GROUP_EVENT_FORCE_INITIATE":
        case 0:
            message.evenType = 0;
            break;
        case "GROUP_EVENT_BROADCAST":
        case 1:
            message.evenType = 1;
            break;
        case "GROUP_EVENT_UNICAST":
        case 2:
            message.evenType = 2;
            break;
        case "GROUP_EVENT_UPDATE":
        case 3:
            message.evenType = 3;
            break;
        case "GROUP_EVENT_FORCE_DESTROY":
        case 4:
            message.evenType = 4;
            break;
        }
        switch (object.msgType) {
        default:
            if (typeof object.msgType === "number") {
                message.msgType = object.msgType;
                break;
            }
            break;
        case "GROUP_REQ_FORCE_INITIATE":
        case 0:
            message.msgType = 0;
            break;
        case "GROUP_REQ_CREATE":
        case 1:
            message.msgType = 1;
            break;
        case "GROUP_REQ_INITIATE":
        case 2:
            message.msgType = 2;
            break;
        case "GROUP_REQ_DESTROY":
        case 3:
            message.msgType = 3;
            break;
        case "GROUP_REQ_BROADCAST":
        case 4:
            message.msgType = 4;
            break;
        case "GROUP_REQ_UNICAST":
        case 5:
            message.msgType = 5;
            break;
        case "GROUP_UPDATE":
        case 6:
            message.msgType = 6;
            break;
        case "GROUP_REQ_FORCE_DESTROY":
        case 7:
            message.msgType = 7;
            break;
        }
        if (object.msg != null)
            message.msg = String(object.msg);
        if (object.groupBaseInfo != null) {
            if (typeof object.groupBaseInfo !== "object")
                throw TypeError(".CommonMsgDto.groupBaseInfo: object expected");
            message.groupBaseInfo = $root.GroupBaseInfo.fromObject(object.groupBaseInfo);
        }
        if (object.updateTime != null)
            if ($util.Long)
                (message.updateTime = $util.Long.fromValue(object.updateTime)).unsigned = false;
            else if (typeof object.updateTime === "string")
                message.updateTime = parseInt(object.updateTime, 10);
            else if (typeof object.updateTime === "number")
                message.updateTime = object.updateTime;
            else if (typeof object.updateTime === "object")
                message.updateTime = new $util.LongBits(object.updateTime.low >>> 0, object.updateTime.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a CommonMsgDto message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CommonMsgDto
     * @static
     * @param {CommonMsgDto} message CommonMsgDto
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CommonMsgDto.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.msgId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.msgId = options.longs === String ? "0" : 0;
            object.evenType = options.enums === String ? "GROUP_EVENT_FORCE_INITIATE" : 0;
            object.msgType = options.enums === String ? "GROUP_REQ_FORCE_INITIATE" : 0;
            object.msg = "";
            object.groupBaseInfo = null;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.updateTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.updateTime = options.longs === String ? "0" : 0;
        }
        if (message.msgId != null && message.hasOwnProperty("msgId"))
            if (typeof message.msgId === "number")
                object.msgId = options.longs === String ? String(message.msgId) : message.msgId;
            else
                object.msgId = options.longs === String ? $util.Long.prototype.toString.call(message.msgId) : options.longs === Number ? new $util.LongBits(message.msgId.low >>> 0, message.msgId.high >>> 0).toNumber() : message.msgId;
        if (message.evenType != null && message.hasOwnProperty("evenType"))
            object.evenType = options.enums === String ? $root.GroupEventType[message.evenType] === undefined ? message.evenType : $root.GroupEventType[message.evenType] : message.evenType;
        if (message.msgType != null && message.hasOwnProperty("msgType"))
            object.msgType = options.enums === String ? $root.GroupMsgType[message.msgType] === undefined ? message.msgType : $root.GroupMsgType[message.msgType] : message.msgType;
        if (message.msg != null && message.hasOwnProperty("msg"))
            object.msg = message.msg;
        if (message.groupBaseInfo != null && message.hasOwnProperty("groupBaseInfo"))
            object.groupBaseInfo = $root.GroupBaseInfo.toObject(message.groupBaseInfo, options);
        if (message.updateTime != null && message.hasOwnProperty("updateTime"))
            if (typeof message.updateTime === "number")
                object.updateTime = options.longs === String ? String(message.updateTime) : message.updateTime;
            else
                object.updateTime = options.longs === String ? $util.Long.prototype.toString.call(message.updateTime) : options.longs === Number ? new $util.LongBits(message.updateTime.low >>> 0, message.updateTime.high >>> 0).toNumber() : message.updateTime;
        return object;
    };

    /**
     * Converts this CommonMsgDto to JSON.
     * @function toJSON
     * @memberof CommonMsgDto
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CommonMsgDto.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CommonMsgDto
     * @function getTypeUrl
     * @memberof CommonMsgDto
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CommonMsgDto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CommonMsgDto";
    };

    return CommonMsgDto;
})();

export const GroupBaseInfo = $root.GroupBaseInfo = (() => {

    /**
     * Properties of a GroupBaseInfo.
     * @exports IGroupBaseInfo
     * @interface IGroupBaseInfo
     * @property {number|Long|null} [groupId] GroupBaseInfo groupId
     * @property {string|null} [groupName] GroupBaseInfo groupName
     * @property {string|null} [pic] GroupBaseInfo pic
     * @property {boolean|null} [groupReadCancel] GroupBaseInfo groupReadCancel
     * @property {number|null} [groupMsgCancelTime] GroupBaseInfo groupMsgCancelTime
     * @property {boolean|null} [groupShutup] GroupBaseInfo groupShutup
     */

    /**
     * Constructs a new GroupBaseInfo.
     * @exports GroupBaseInfo
     * @classdesc Represents a GroupBaseInfo.
     * @implements IGroupBaseInfo
     * @constructor
     * @param {IGroupBaseInfo=} [properties] Properties to set
     */
    function GroupBaseInfo(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupBaseInfo groupId.
     * @member {number|Long} groupId
     * @memberof GroupBaseInfo
     * @instance
     */
    GroupBaseInfo.prototype.groupId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupBaseInfo groupName.
     * @member {string} groupName
     * @memberof GroupBaseInfo
     * @instance
     */
    GroupBaseInfo.prototype.groupName = "";

    /**
     * GroupBaseInfo pic.
     * @member {string} pic
     * @memberof GroupBaseInfo
     * @instance
     */
    GroupBaseInfo.prototype.pic = "";

    /**
     * GroupBaseInfo groupReadCancel.
     * @member {boolean} groupReadCancel
     * @memberof GroupBaseInfo
     * @instance
     */
    GroupBaseInfo.prototype.groupReadCancel = false;

    /**
     * GroupBaseInfo groupMsgCancelTime.
     * @member {number} groupMsgCancelTime
     * @memberof GroupBaseInfo
     * @instance
     */
    GroupBaseInfo.prototype.groupMsgCancelTime = 0;

    /**
     * GroupBaseInfo groupShutup.
     * @member {boolean} groupShutup
     * @memberof GroupBaseInfo
     * @instance
     */
    GroupBaseInfo.prototype.groupShutup = false;

    /**
     * Creates a new GroupBaseInfo instance using the specified properties.
     * @function create
     * @memberof GroupBaseInfo
     * @static
     * @param {IGroupBaseInfo=} [properties] Properties to set
     * @returns {GroupBaseInfo} GroupBaseInfo instance
     */
    GroupBaseInfo.create = function create(properties) {
        return new GroupBaseInfo(properties);
    };

    /**
     * Encodes the specified GroupBaseInfo message. Does not implicitly {@link GroupBaseInfo.verify|verify} messages.
     * @function encode
     * @memberof GroupBaseInfo
     * @static
     * @param {IGroupBaseInfo} message GroupBaseInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupBaseInfo.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.groupId != null && Object.hasOwnProperty.call(message, "groupId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.groupId);
        if (message.groupName != null && Object.hasOwnProperty.call(message, "groupName"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.groupName);
        if (message.pic != null && Object.hasOwnProperty.call(message, "pic"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.pic);
        if (message.groupReadCancel != null && Object.hasOwnProperty.call(message, "groupReadCancel"))
            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.groupReadCancel);
        if (message.groupMsgCancelTime != null && Object.hasOwnProperty.call(message, "groupMsgCancelTime"))
            writer.uint32(/* id 5, wireType 0 =*/40).int32(message.groupMsgCancelTime);
        if (message.groupShutup != null && Object.hasOwnProperty.call(message, "groupShutup"))
            writer.uint32(/* id 6, wireType 0 =*/48).bool(message.groupShutup);
        return writer;
    };

    /**
     * Encodes the specified GroupBaseInfo message, length delimited. Does not implicitly {@link GroupBaseInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupBaseInfo
     * @static
     * @param {IGroupBaseInfo} message GroupBaseInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupBaseInfo.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupBaseInfo message from the specified reader or buffer.
     * @function decode
     * @memberof GroupBaseInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupBaseInfo} GroupBaseInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupBaseInfo.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupBaseInfo();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.groupId = reader.int64();
                    break;
                }
            case 2: {
                    message.groupName = reader.string();
                    break;
                }
            case 3: {
                    message.pic = reader.string();
                    break;
                }
            case 4: {
                    message.groupReadCancel = reader.bool();
                    break;
                }
            case 5: {
                    message.groupMsgCancelTime = reader.int32();
                    break;
                }
            case 6: {
                    message.groupShutup = reader.bool();
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
     * Decodes a GroupBaseInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupBaseInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupBaseInfo} GroupBaseInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupBaseInfo.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupBaseInfo message.
     * @function verify
     * @memberof GroupBaseInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupBaseInfo.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (!$util.isInteger(message.groupId) && !(message.groupId && $util.isInteger(message.groupId.low) && $util.isInteger(message.groupId.high)))
                return "groupId: integer|Long expected";
        if (message.groupName != null && message.hasOwnProperty("groupName"))
            if (!$util.isString(message.groupName))
                return "groupName: string expected";
        if (message.pic != null && message.hasOwnProperty("pic"))
            if (!$util.isString(message.pic))
                return "pic: string expected";
        if (message.groupReadCancel != null && message.hasOwnProperty("groupReadCancel"))
            if (typeof message.groupReadCancel !== "boolean")
                return "groupReadCancel: boolean expected";
        if (message.groupMsgCancelTime != null && message.hasOwnProperty("groupMsgCancelTime"))
            if (!$util.isInteger(message.groupMsgCancelTime))
                return "groupMsgCancelTime: integer expected";
        if (message.groupShutup != null && message.hasOwnProperty("groupShutup"))
            if (typeof message.groupShutup !== "boolean")
                return "groupShutup: boolean expected";
        return null;
    };

    /**
     * Creates a GroupBaseInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupBaseInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupBaseInfo} GroupBaseInfo
     */
    GroupBaseInfo.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupBaseInfo)
            return object;
        let message = new $root.GroupBaseInfo();
        if (object.groupId != null)
            if ($util.Long)
                (message.groupId = $util.Long.fromValue(object.groupId)).unsigned = false;
            else if (typeof object.groupId === "string")
                message.groupId = parseInt(object.groupId, 10);
            else if (typeof object.groupId === "number")
                message.groupId = object.groupId;
            else if (typeof object.groupId === "object")
                message.groupId = new $util.LongBits(object.groupId.low >>> 0, object.groupId.high >>> 0).toNumber();
        if (object.groupName != null)
            message.groupName = String(object.groupName);
        if (object.pic != null)
            message.pic = String(object.pic);
        if (object.groupReadCancel != null)
            message.groupReadCancel = Boolean(object.groupReadCancel);
        if (object.groupMsgCancelTime != null)
            message.groupMsgCancelTime = object.groupMsgCancelTime | 0;
        if (object.groupShutup != null)
            message.groupShutup = Boolean(object.groupShutup);
        return message;
    };

    /**
     * Creates a plain object from a GroupBaseInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupBaseInfo
     * @static
     * @param {GroupBaseInfo} message GroupBaseInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupBaseInfo.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.groupId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.groupId = options.longs === String ? "0" : 0;
            object.groupName = "";
            object.pic = "";
            object.groupReadCancel = false;
            object.groupMsgCancelTime = 0;
            object.groupShutup = false;
        }
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (typeof message.groupId === "number")
                object.groupId = options.longs === String ? String(message.groupId) : message.groupId;
            else
                object.groupId = options.longs === String ? $util.Long.prototype.toString.call(message.groupId) : options.longs === Number ? new $util.LongBits(message.groupId.low >>> 0, message.groupId.high >>> 0).toNumber() : message.groupId;
        if (message.groupName != null && message.hasOwnProperty("groupName"))
            object.groupName = message.groupName;
        if (message.pic != null && message.hasOwnProperty("pic"))
            object.pic = message.pic;
        if (message.groupReadCancel != null && message.hasOwnProperty("groupReadCancel"))
            object.groupReadCancel = message.groupReadCancel;
        if (message.groupMsgCancelTime != null && message.hasOwnProperty("groupMsgCancelTime"))
            object.groupMsgCancelTime = message.groupMsgCancelTime;
        if (message.groupShutup != null && message.hasOwnProperty("groupShutup"))
            object.groupShutup = message.groupShutup;
        return object;
    };

    /**
     * Converts this GroupBaseInfo to JSON.
     * @function toJSON
     * @memberof GroupBaseInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupBaseInfo.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupBaseInfo
     * @function getTypeUrl
     * @memberof GroupBaseInfo
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupBaseInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupBaseInfo";
    };

    return GroupBaseInfo;
})();

export const GroupUpdateEventMsgDto = $root.GroupUpdateEventMsgDto = (() => {

    /**
     * Properties of a GroupUpdateEventMsgDto.
     * @exports IGroupUpdateEventMsgDto
     * @interface IGroupUpdateEventMsgDto
     * @property {ICommonMsgDto|null} [commonMsgDto] GroupUpdateEventMsgDto commonMsgDto
     * @property {number|Long|null} [fromUid] GroupUpdateEventMsgDto fromUid
     * @property {GroupHandleType|null} [handleType] GroupUpdateEventMsgDto handleType
     * @property {Array.<IGroupMemberBase>|null} [groupMember] GroupUpdateEventMsgDto groupMember
     */

    /**
     * Constructs a new GroupUpdateEventMsgDto.
     * @exports GroupUpdateEventMsgDto
     * @classdesc Represents a GroupUpdateEventMsgDto.
     * @implements IGroupUpdateEventMsgDto
     * @constructor
     * @param {IGroupUpdateEventMsgDto=} [properties] Properties to set
     */
    function GroupUpdateEventMsgDto(properties) {
        this.groupMember = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupUpdateEventMsgDto commonMsgDto.
     * @member {ICommonMsgDto|null|undefined} commonMsgDto
     * @memberof GroupUpdateEventMsgDto
     * @instance
     */
    GroupUpdateEventMsgDto.prototype.commonMsgDto = null;

    /**
     * GroupUpdateEventMsgDto fromUid.
     * @member {number|Long} fromUid
     * @memberof GroupUpdateEventMsgDto
     * @instance
     */
    GroupUpdateEventMsgDto.prototype.fromUid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupUpdateEventMsgDto handleType.
     * @member {GroupHandleType} handleType
     * @memberof GroupUpdateEventMsgDto
     * @instance
     */
    GroupUpdateEventMsgDto.prototype.handleType = 0;

    /**
     * GroupUpdateEventMsgDto groupMember.
     * @member {Array.<IGroupMemberBase>} groupMember
     * @memberof GroupUpdateEventMsgDto
     * @instance
     */
    GroupUpdateEventMsgDto.prototype.groupMember = $util.emptyArray;

    /**
     * Creates a new GroupUpdateEventMsgDto instance using the specified properties.
     * @function create
     * @memberof GroupUpdateEventMsgDto
     * @static
     * @param {IGroupUpdateEventMsgDto=} [properties] Properties to set
     * @returns {GroupUpdateEventMsgDto} GroupUpdateEventMsgDto instance
     */
    GroupUpdateEventMsgDto.create = function create(properties) {
        return new GroupUpdateEventMsgDto(properties);
    };

    /**
     * Encodes the specified GroupUpdateEventMsgDto message. Does not implicitly {@link GroupUpdateEventMsgDto.verify|verify} messages.
     * @function encode
     * @memberof GroupUpdateEventMsgDto
     * @static
     * @param {IGroupUpdateEventMsgDto} message GroupUpdateEventMsgDto message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupUpdateEventMsgDto.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.commonMsgDto != null && Object.hasOwnProperty.call(message, "commonMsgDto"))
            $root.CommonMsgDto.encode(message.commonMsgDto, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.fromUid != null && Object.hasOwnProperty.call(message, "fromUid"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.fromUid);
        if (message.handleType != null && Object.hasOwnProperty.call(message, "handleType"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.handleType);
        if (message.groupMember != null && message.groupMember.length)
            for (let i = 0; i < message.groupMember.length; ++i)
                $root.GroupMemberBase.encode(message.groupMember[i], writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified GroupUpdateEventMsgDto message, length delimited. Does not implicitly {@link GroupUpdateEventMsgDto.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupUpdateEventMsgDto
     * @static
     * @param {IGroupUpdateEventMsgDto} message GroupUpdateEventMsgDto message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupUpdateEventMsgDto.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupUpdateEventMsgDto message from the specified reader or buffer.
     * @function decode
     * @memberof GroupUpdateEventMsgDto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupUpdateEventMsgDto} GroupUpdateEventMsgDto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupUpdateEventMsgDto.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupUpdateEventMsgDto();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.commonMsgDto = $root.CommonMsgDto.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    message.fromUid = reader.int64();
                    break;
                }
            case 3: {
                    message.handleType = reader.int32();
                    break;
                }
            case 4: {
                    if (!(message.groupMember && message.groupMember.length))
                        message.groupMember = [];
                    message.groupMember.push($root.GroupMemberBase.decode(reader, reader.uint32()));
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
     * Decodes a GroupUpdateEventMsgDto message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupUpdateEventMsgDto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupUpdateEventMsgDto} GroupUpdateEventMsgDto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupUpdateEventMsgDto.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupUpdateEventMsgDto message.
     * @function verify
     * @memberof GroupUpdateEventMsgDto
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupUpdateEventMsgDto.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.commonMsgDto != null && message.hasOwnProperty("commonMsgDto")) {
            let error = $root.CommonMsgDto.verify(message.commonMsgDto);
            if (error)
                return "commonMsgDto." + error;
        }
        if (message.fromUid != null && message.hasOwnProperty("fromUid"))
            if (!$util.isInteger(message.fromUid) && !(message.fromUid && $util.isInteger(message.fromUid.low) && $util.isInteger(message.fromUid.high)))
                return "fromUid: integer|Long expected";
        if (message.handleType != null && message.hasOwnProperty("handleType"))
            switch (message.handleType) {
            default:
                return "handleType: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
                break;
            }
        if (message.groupMember != null && message.hasOwnProperty("groupMember")) {
            if (!Array.isArray(message.groupMember))
                return "groupMember: array expected";
            for (let i = 0; i < message.groupMember.length; ++i) {
                let error = $root.GroupMemberBase.verify(message.groupMember[i]);
                if (error)
                    return "groupMember." + error;
            }
        }
        return null;
    };

    /**
     * Creates a GroupUpdateEventMsgDto message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupUpdateEventMsgDto
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupUpdateEventMsgDto} GroupUpdateEventMsgDto
     */
    GroupUpdateEventMsgDto.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupUpdateEventMsgDto)
            return object;
        let message = new $root.GroupUpdateEventMsgDto();
        if (object.commonMsgDto != null) {
            if (typeof object.commonMsgDto !== "object")
                throw TypeError(".GroupUpdateEventMsgDto.commonMsgDto: object expected");
            message.commonMsgDto = $root.CommonMsgDto.fromObject(object.commonMsgDto);
        }
        if (object.fromUid != null)
            if ($util.Long)
                (message.fromUid = $util.Long.fromValue(object.fromUid)).unsigned = false;
            else if (typeof object.fromUid === "string")
                message.fromUid = parseInt(object.fromUid, 10);
            else if (typeof object.fromUid === "number")
                message.fromUid = object.fromUid;
            else if (typeof object.fromUid === "object")
                message.fromUid = new $util.LongBits(object.fromUid.low >>> 0, object.fromUid.high >>> 0).toNumber();
        switch (object.handleType) {
        default:
            if (typeof object.handleType === "number") {
                message.handleType = object.handleType;
                break;
            }
            break;
        case "GROUP_REQ":
        case 0:
            message.handleType = 0;
            break;
        case "GROUP_NAME":
        case 1:
            message.handleType = 1;
            break;
        case "GROUP_PIC":
        case 2:
            message.handleType = 2;
            break;
        case "GROUP_MEMBER_NICKNAME":
        case 3:
            message.handleType = 3;
            break;
        case "GROUP_NOTICE":
        case 4:
            message.handleType = 4;
            break;
        case "GROUP_SHUTUP":
        case 5:
            message.handleType = 5;
            break;
        case "GROUP_READ_CANCEL":
        case 6:
            message.handleType = 6;
            break;
        }
        if (object.groupMember) {
            if (!Array.isArray(object.groupMember))
                throw TypeError(".GroupUpdateEventMsgDto.groupMember: array expected");
            message.groupMember = [];
            for (let i = 0; i < object.groupMember.length; ++i) {
                if (typeof object.groupMember[i] !== "object")
                    throw TypeError(".GroupUpdateEventMsgDto.groupMember: object expected");
                message.groupMember[i] = $root.GroupMemberBase.fromObject(object.groupMember[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a GroupUpdateEventMsgDto message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupUpdateEventMsgDto
     * @static
     * @param {GroupUpdateEventMsgDto} message GroupUpdateEventMsgDto
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupUpdateEventMsgDto.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.arrays || options.defaults)
            object.groupMember = [];
        if (options.defaults) {
            object.commonMsgDto = null;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.fromUid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.fromUid = options.longs === String ? "0" : 0;
            object.handleType = options.enums === String ? "GROUP_REQ" : 0;
        }
        if (message.commonMsgDto != null && message.hasOwnProperty("commonMsgDto"))
            object.commonMsgDto = $root.CommonMsgDto.toObject(message.commonMsgDto, options);
        if (message.fromUid != null && message.hasOwnProperty("fromUid"))
            if (typeof message.fromUid === "number")
                object.fromUid = options.longs === String ? String(message.fromUid) : message.fromUid;
            else
                object.fromUid = options.longs === String ? $util.Long.prototype.toString.call(message.fromUid) : options.longs === Number ? new $util.LongBits(message.fromUid.low >>> 0, message.fromUid.high >>> 0).toNumber() : message.fromUid;
        if (message.handleType != null && message.hasOwnProperty("handleType"))
            object.handleType = options.enums === String ? $root.GroupHandleType[message.handleType] === undefined ? message.handleType : $root.GroupHandleType[message.handleType] : message.handleType;
        if (message.groupMember && message.groupMember.length) {
            object.groupMember = [];
            for (let j = 0; j < message.groupMember.length; ++j)
                object.groupMember[j] = $root.GroupMemberBase.toObject(message.groupMember[j], options);
        }
        return object;
    };

    /**
     * Converts this GroupUpdateEventMsgDto to JSON.
     * @function toJSON
     * @memberof GroupUpdateEventMsgDto
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupUpdateEventMsgDto.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupUpdateEventMsgDto
     * @function getTypeUrl
     * @memberof GroupUpdateEventMsgDto
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupUpdateEventMsgDto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupUpdateEventMsgDto";
    };

    return GroupUpdateEventMsgDto;
})();

export const GroupReqEventMsgDto = $root.GroupReqEventMsgDto = (() => {

    /**
     * Properties of a GroupReqEventMsgDto.
     * @exports IGroupReqEventMsgDto
     * @interface IGroupReqEventMsgDto
     * @property {ICommonMsgDto|null} [commonMsgDto] GroupReqEventMsgDto commonMsgDto
     * @property {number|Long|null} [receiveUid] GroupReqEventMsgDto receiveUid
     * @property {number|Long|null} [fromUid] GroupReqEventMsgDto fromUid
     * @property {number|Long|null} [checkUid] GroupReqEventMsgDto checkUid
     * @property {IGroupNoticeMsgDto|null} [groupNoticeMsgDto] GroupReqEventMsgDto groupNoticeMsgDto
     * @property {GroupReqType|null} [groupReqType] GroupReqEventMsgDto groupReqType
     * @property {GroupReqStatus|null} [groupReqStatus] GroupReqEventMsgDto groupReqStatus
     * @property {Array.<IGroupMemberBase>|null} [groupMember] GroupReqEventMsgDto groupMember
     * @property {boolean|null} [isHide] GroupReqEventMsgDto isHide
     */

    /**
     * Constructs a new GroupReqEventMsgDto.
     * @exports GroupReqEventMsgDto
     * @classdesc Represents a GroupReqEventMsgDto.
     * @implements IGroupReqEventMsgDto
     * @constructor
     * @param {IGroupReqEventMsgDto=} [properties] Properties to set
     */
    function GroupReqEventMsgDto(properties) {
        this.groupMember = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupReqEventMsgDto commonMsgDto.
     * @member {ICommonMsgDto|null|undefined} commonMsgDto
     * @memberof GroupReqEventMsgDto
     * @instance
     */
    GroupReqEventMsgDto.prototype.commonMsgDto = null;

    /**
     * GroupReqEventMsgDto receiveUid.
     * @member {number|Long} receiveUid
     * @memberof GroupReqEventMsgDto
     * @instance
     */
    GroupReqEventMsgDto.prototype.receiveUid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupReqEventMsgDto fromUid.
     * @member {number|Long} fromUid
     * @memberof GroupReqEventMsgDto
     * @instance
     */
    GroupReqEventMsgDto.prototype.fromUid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupReqEventMsgDto checkUid.
     * @member {number|Long} checkUid
     * @memberof GroupReqEventMsgDto
     * @instance
     */
    GroupReqEventMsgDto.prototype.checkUid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupReqEventMsgDto groupNoticeMsgDto.
     * @member {IGroupNoticeMsgDto|null|undefined} groupNoticeMsgDto
     * @memberof GroupReqEventMsgDto
     * @instance
     */
    GroupReqEventMsgDto.prototype.groupNoticeMsgDto = null;

    /**
     * GroupReqEventMsgDto groupReqType.
     * @member {GroupReqType} groupReqType
     * @memberof GroupReqEventMsgDto
     * @instance
     */
    GroupReqEventMsgDto.prototype.groupReqType = 0;

    /**
     * GroupReqEventMsgDto groupReqStatus.
     * @member {GroupReqStatus} groupReqStatus
     * @memberof GroupReqEventMsgDto
     * @instance
     */
    GroupReqEventMsgDto.prototype.groupReqStatus = 0;

    /**
     * GroupReqEventMsgDto groupMember.
     * @member {Array.<IGroupMemberBase>} groupMember
     * @memberof GroupReqEventMsgDto
     * @instance
     */
    GroupReqEventMsgDto.prototype.groupMember = $util.emptyArray;

    /**
     * GroupReqEventMsgDto isHide.
     * @member {boolean} isHide
     * @memberof GroupReqEventMsgDto
     * @instance
     */
    GroupReqEventMsgDto.prototype.isHide = false;

    /**
     * Creates a new GroupReqEventMsgDto instance using the specified properties.
     * @function create
     * @memberof GroupReqEventMsgDto
     * @static
     * @param {IGroupReqEventMsgDto=} [properties] Properties to set
     * @returns {GroupReqEventMsgDto} GroupReqEventMsgDto instance
     */
    GroupReqEventMsgDto.create = function create(properties) {
        return new GroupReqEventMsgDto(properties);
    };

    /**
     * Encodes the specified GroupReqEventMsgDto message. Does not implicitly {@link GroupReqEventMsgDto.verify|verify} messages.
     * @function encode
     * @memberof GroupReqEventMsgDto
     * @static
     * @param {IGroupReqEventMsgDto} message GroupReqEventMsgDto message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupReqEventMsgDto.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.commonMsgDto != null && Object.hasOwnProperty.call(message, "commonMsgDto"))
            $root.CommonMsgDto.encode(message.commonMsgDto, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.receiveUid != null && Object.hasOwnProperty.call(message, "receiveUid"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.receiveUid);
        if (message.fromUid != null && Object.hasOwnProperty.call(message, "fromUid"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.fromUid);
        if (message.checkUid != null && Object.hasOwnProperty.call(message, "checkUid"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.checkUid);
        if (message.groupNoticeMsgDto != null && Object.hasOwnProperty.call(message, "groupNoticeMsgDto"))
            $root.GroupNoticeMsgDto.encode(message.groupNoticeMsgDto, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
        if (message.groupReqType != null && Object.hasOwnProperty.call(message, "groupReqType"))
            writer.uint32(/* id 6, wireType 0 =*/48).int32(message.groupReqType);
        if (message.groupReqStatus != null && Object.hasOwnProperty.call(message, "groupReqStatus"))
            writer.uint32(/* id 7, wireType 0 =*/56).int32(message.groupReqStatus);
        if (message.groupMember != null && message.groupMember.length)
            for (let i = 0; i < message.groupMember.length; ++i)
                $root.GroupMemberBase.encode(message.groupMember[i], writer.uint32(/* id 8, wireType 2 =*/66).fork()).ldelim();
        if (message.isHide != null && Object.hasOwnProperty.call(message, "isHide"))
            writer.uint32(/* id 9, wireType 0 =*/72).bool(message.isHide);
        return writer;
    };

    /**
     * Encodes the specified GroupReqEventMsgDto message, length delimited. Does not implicitly {@link GroupReqEventMsgDto.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupReqEventMsgDto
     * @static
     * @param {IGroupReqEventMsgDto} message GroupReqEventMsgDto message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupReqEventMsgDto.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupReqEventMsgDto message from the specified reader or buffer.
     * @function decode
     * @memberof GroupReqEventMsgDto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupReqEventMsgDto} GroupReqEventMsgDto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupReqEventMsgDto.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupReqEventMsgDto();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.commonMsgDto = $root.CommonMsgDto.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    message.receiveUid = reader.int64();
                    break;
                }
            case 3: {
                    message.fromUid = reader.int64();
                    break;
                }
            case 4: {
                    message.checkUid = reader.int64();
                    break;
                }
            case 5: {
                    message.groupNoticeMsgDto = $root.GroupNoticeMsgDto.decode(reader, reader.uint32());
                    break;
                }
            case 6: {
                    message.groupReqType = reader.int32();
                    break;
                }
            case 7: {
                    message.groupReqStatus = reader.int32();
                    break;
                }
            case 8: {
                    if (!(message.groupMember && message.groupMember.length))
                        message.groupMember = [];
                    message.groupMember.push($root.GroupMemberBase.decode(reader, reader.uint32()));
                    break;
                }
            case 9: {
                    message.isHide = reader.bool();
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
     * Decodes a GroupReqEventMsgDto message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupReqEventMsgDto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupReqEventMsgDto} GroupReqEventMsgDto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupReqEventMsgDto.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupReqEventMsgDto message.
     * @function verify
     * @memberof GroupReqEventMsgDto
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupReqEventMsgDto.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.commonMsgDto != null && message.hasOwnProperty("commonMsgDto")) {
            let error = $root.CommonMsgDto.verify(message.commonMsgDto);
            if (error)
                return "commonMsgDto." + error;
        }
        if (message.receiveUid != null && message.hasOwnProperty("receiveUid"))
            if (!$util.isInteger(message.receiveUid) && !(message.receiveUid && $util.isInteger(message.receiveUid.low) && $util.isInteger(message.receiveUid.high)))
                return "receiveUid: integer|Long expected";
        if (message.fromUid != null && message.hasOwnProperty("fromUid"))
            if (!$util.isInteger(message.fromUid) && !(message.fromUid && $util.isInteger(message.fromUid.low) && $util.isInteger(message.fromUid.high)))
                return "fromUid: integer|Long expected";
        if (message.checkUid != null && message.hasOwnProperty("checkUid"))
            if (!$util.isInteger(message.checkUid) && !(message.checkUid && $util.isInteger(message.checkUid.low) && $util.isInteger(message.checkUid.high)))
                return "checkUid: integer|Long expected";
        if (message.groupNoticeMsgDto != null && message.hasOwnProperty("groupNoticeMsgDto")) {
            let error = $root.GroupNoticeMsgDto.verify(message.groupNoticeMsgDto);
            if (error)
                return "groupNoticeMsgDto." + error;
        }
        if (message.groupReqType != null && message.hasOwnProperty("groupReqType"))
            switch (message.groupReqType) {
            default:
                return "groupReqType: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
            case 16:
            case 17:
            case 18:
                break;
            }
        if (message.groupReqStatus != null && message.hasOwnProperty("groupReqStatus"))
            switch (message.groupReqStatus) {
            default:
                return "groupReqStatus: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
                break;
            }
        if (message.groupMember != null && message.hasOwnProperty("groupMember")) {
            if (!Array.isArray(message.groupMember))
                return "groupMember: array expected";
            for (let i = 0; i < message.groupMember.length; ++i) {
                let error = $root.GroupMemberBase.verify(message.groupMember[i]);
                if (error)
                    return "groupMember." + error;
            }
        }
        if (message.isHide != null && message.hasOwnProperty("isHide"))
            if (typeof message.isHide !== "boolean")
                return "isHide: boolean expected";
        return null;
    };

    /**
     * Creates a GroupReqEventMsgDto message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupReqEventMsgDto
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupReqEventMsgDto} GroupReqEventMsgDto
     */
    GroupReqEventMsgDto.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupReqEventMsgDto)
            return object;
        let message = new $root.GroupReqEventMsgDto();
        if (object.commonMsgDto != null) {
            if (typeof object.commonMsgDto !== "object")
                throw TypeError(".GroupReqEventMsgDto.commonMsgDto: object expected");
            message.commonMsgDto = $root.CommonMsgDto.fromObject(object.commonMsgDto);
        }
        if (object.receiveUid != null)
            if ($util.Long)
                (message.receiveUid = $util.Long.fromValue(object.receiveUid)).unsigned = false;
            else if (typeof object.receiveUid === "string")
                message.receiveUid = parseInt(object.receiveUid, 10);
            else if (typeof object.receiveUid === "number")
                message.receiveUid = object.receiveUid;
            else if (typeof object.receiveUid === "object")
                message.receiveUid = new $util.LongBits(object.receiveUid.low >>> 0, object.receiveUid.high >>> 0).toNumber();
        if (object.fromUid != null)
            if ($util.Long)
                (message.fromUid = $util.Long.fromValue(object.fromUid)).unsigned = false;
            else if (typeof object.fromUid === "string")
                message.fromUid = parseInt(object.fromUid, 10);
            else if (typeof object.fromUid === "number")
                message.fromUid = object.fromUid;
            else if (typeof object.fromUid === "object")
                message.fromUid = new $util.LongBits(object.fromUid.low >>> 0, object.fromUid.high >>> 0).toNumber();
        if (object.checkUid != null)
            if ($util.Long)
                (message.checkUid = $util.Long.fromValue(object.checkUid)).unsigned = false;
            else if (typeof object.checkUid === "string")
                message.checkUid = parseInt(object.checkUid, 10);
            else if (typeof object.checkUid === "number")
                message.checkUid = object.checkUid;
            else if (typeof object.checkUid === "object")
                message.checkUid = new $util.LongBits(object.checkUid.low >>> 0, object.checkUid.high >>> 0).toNumber();
        if (object.groupNoticeMsgDto != null) {
            if (typeof object.groupNoticeMsgDto !== "object")
                throw TypeError(".GroupReqEventMsgDto.groupNoticeMsgDto: object expected");
            message.groupNoticeMsgDto = $root.GroupNoticeMsgDto.fromObject(object.groupNoticeMsgDto);
        }
        switch (object.groupReqType) {
        default:
            if (typeof object.groupReqType === "number") {
                message.groupReqType = object.groupReqType;
                break;
            }
            break;
        case "GROUP_TRANSFER":
        case 0:
            message.groupReqType = 0;
            break;
        case "GROUP_INVITE":
        case 1:
            message.groupReqType = 1;
            break;
        case "GROUP_QR_CODE":
        case 2:
            message.groupReqType = 2;
            break;
        case "GROUP_OWNER_CHECK_INVITE":
        case 3:
            message.groupReqType = 3;
            break;
        case "GROUP_OWNER_CHECK_QR_CODE":
        case 4:
            message.groupReqType = 4;
            break;
        case "GROUP_MEMBER_CHECK":
        case 5:
            message.groupReqType = 5;
            break;
        case "GROUP_OWNER_REMOVE_MEMBER":
        case 6:
            message.groupReqType = 6;
            break;
        case "GROUP_MEMBER_EXIT":
        case 7:
            message.groupReqType = 7;
            break;
        case "GROUP_SET_ADMIN":
        case 8:
            message.groupReqType = 8;
            break;
        case "GROUP_CANCLE_ADMIN":
        case 9:
            message.groupReqType = 9;
            break;
        case "GROUP_ADMIN_UPDATE":
        case 10:
            message.groupReqType = 10;
            break;
        case "GROUP_IS_DISABLED":
        case 11:
            message.groupReqType = 11;
            break;
        case "GROUP_MEMBER_SHUTUP":
        case 12:
            message.groupReqType = 12;
            break;
        case "GROUP_IS_DISBANDED":
        case 13:
            message.groupReqType = 13;
            break;
        case "GROUP_LINK":
        case 14:
            message.groupReqType = 14;
            break;
        case "GROUP_ALIAS":
        case 15:
            message.groupReqType = 15;
            break;
        case "GROUP_IS_ENABLED":
        case 16:
            message.groupReqType = 16;
            break;
        case "GROUP_OBSERVE_ADD":
        case 17:
            message.groupReqType = 17;
            break;
        case "GROUP_OBSERVE_REMOVE":
        case 18:
            message.groupReqType = 18;
            break;
        }
        switch (object.groupReqStatus) {
        default:
            if (typeof object.groupReqStatus === "number") {
                message.groupReqStatus = object.groupReqStatus;
                break;
            }
            break;
        case "CHECKING":
        case 0:
            message.groupReqStatus = 0;
            break;
        case "AGREE":
        case 1:
            message.groupReqStatus = 1;
            break;
        case "REFUSE":
        case 2:
            message.groupReqStatus = 2;
            break;
        case "EXPIRE":
        case 3:
            message.groupReqStatus = 3;
            break;
        }
        if (object.groupMember) {
            if (!Array.isArray(object.groupMember))
                throw TypeError(".GroupReqEventMsgDto.groupMember: array expected");
            message.groupMember = [];
            for (let i = 0; i < object.groupMember.length; ++i) {
                if (typeof object.groupMember[i] !== "object")
                    throw TypeError(".GroupReqEventMsgDto.groupMember: object expected");
                message.groupMember[i] = $root.GroupMemberBase.fromObject(object.groupMember[i]);
            }
        }
        if (object.isHide != null)
            message.isHide = Boolean(object.isHide);
        return message;
    };

    /**
     * Creates a plain object from a GroupReqEventMsgDto message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupReqEventMsgDto
     * @static
     * @param {GroupReqEventMsgDto} message GroupReqEventMsgDto
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupReqEventMsgDto.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.arrays || options.defaults)
            object.groupMember = [];
        if (options.defaults) {
            object.commonMsgDto = null;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.receiveUid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.receiveUid = options.longs === String ? "0" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.fromUid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.fromUid = options.longs === String ? "0" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.checkUid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.checkUid = options.longs === String ? "0" : 0;
            object.groupNoticeMsgDto = null;
            object.groupReqType = options.enums === String ? "GROUP_TRANSFER" : 0;
            object.groupReqStatus = options.enums === String ? "CHECKING" : 0;
            object.isHide = false;
        }
        if (message.commonMsgDto != null && message.hasOwnProperty("commonMsgDto"))
            object.commonMsgDto = $root.CommonMsgDto.toObject(message.commonMsgDto, options);
        if (message.receiveUid != null && message.hasOwnProperty("receiveUid"))
            if (typeof message.receiveUid === "number")
                object.receiveUid = options.longs === String ? String(message.receiveUid) : message.receiveUid;
            else
                object.receiveUid = options.longs === String ? $util.Long.prototype.toString.call(message.receiveUid) : options.longs === Number ? new $util.LongBits(message.receiveUid.low >>> 0, message.receiveUid.high >>> 0).toNumber() : message.receiveUid;
        if (message.fromUid != null && message.hasOwnProperty("fromUid"))
            if (typeof message.fromUid === "number")
                object.fromUid = options.longs === String ? String(message.fromUid) : message.fromUid;
            else
                object.fromUid = options.longs === String ? $util.Long.prototype.toString.call(message.fromUid) : options.longs === Number ? new $util.LongBits(message.fromUid.low >>> 0, message.fromUid.high >>> 0).toNumber() : message.fromUid;
        if (message.checkUid != null && message.hasOwnProperty("checkUid"))
            if (typeof message.checkUid === "number")
                object.checkUid = options.longs === String ? String(message.checkUid) : message.checkUid;
            else
                object.checkUid = options.longs === String ? $util.Long.prototype.toString.call(message.checkUid) : options.longs === Number ? new $util.LongBits(message.checkUid.low >>> 0, message.checkUid.high >>> 0).toNumber() : message.checkUid;
        if (message.groupNoticeMsgDto != null && message.hasOwnProperty("groupNoticeMsgDto"))
            object.groupNoticeMsgDto = $root.GroupNoticeMsgDto.toObject(message.groupNoticeMsgDto, options);
        if (message.groupReqType != null && message.hasOwnProperty("groupReqType"))
            object.groupReqType = options.enums === String ? $root.GroupReqType[message.groupReqType] === undefined ? message.groupReqType : $root.GroupReqType[message.groupReqType] : message.groupReqType;
        if (message.groupReqStatus != null && message.hasOwnProperty("groupReqStatus"))
            object.groupReqStatus = options.enums === String ? $root.GroupReqStatus[message.groupReqStatus] === undefined ? message.groupReqStatus : $root.GroupReqStatus[message.groupReqStatus] : message.groupReqStatus;
        if (message.groupMember && message.groupMember.length) {
            object.groupMember = [];
            for (let j = 0; j < message.groupMember.length; ++j)
                object.groupMember[j] = $root.GroupMemberBase.toObject(message.groupMember[j], options);
        }
        if (message.isHide != null && message.hasOwnProperty("isHide"))
            object.isHide = message.isHide;
        return object;
    };

    /**
     * Converts this GroupReqEventMsgDto to JSON.
     * @function toJSON
     * @memberof GroupReqEventMsgDto
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupReqEventMsgDto.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupReqEventMsgDto
     * @function getTypeUrl
     * @memberof GroupReqEventMsgDto
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupReqEventMsgDto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupReqEventMsgDto";
    };

    return GroupReqEventMsgDto;
})();

export const GroupNoticeMsgDto = $root.GroupNoticeMsgDto = (() => {

    /**
     * Properties of a GroupNoticeMsgDto.
     * @exports IGroupNoticeMsgDto
     * @interface IGroupNoticeMsgDto
     * @property {boolean|null} [isNotice] GroupNoticeMsgDto isNotice
     * @property {string|null} [noticeMsg] GroupNoticeMsgDto noticeMsg
     * @property {number|Long|null} [unReadNum] GroupNoticeMsgDto unReadNum
     */

    /**
     * Constructs a new GroupNoticeMsgDto.
     * @exports GroupNoticeMsgDto
     * @classdesc Represents a GroupNoticeMsgDto.
     * @implements IGroupNoticeMsgDto
     * @constructor
     * @param {IGroupNoticeMsgDto=} [properties] Properties to set
     */
    function GroupNoticeMsgDto(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupNoticeMsgDto isNotice.
     * @member {boolean} isNotice
     * @memberof GroupNoticeMsgDto
     * @instance
     */
    GroupNoticeMsgDto.prototype.isNotice = false;

    /**
     * GroupNoticeMsgDto noticeMsg.
     * @member {string} noticeMsg
     * @memberof GroupNoticeMsgDto
     * @instance
     */
    GroupNoticeMsgDto.prototype.noticeMsg = "";

    /**
     * GroupNoticeMsgDto unReadNum.
     * @member {number|Long} unReadNum
     * @memberof GroupNoticeMsgDto
     * @instance
     */
    GroupNoticeMsgDto.prototype.unReadNum = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new GroupNoticeMsgDto instance using the specified properties.
     * @function create
     * @memberof GroupNoticeMsgDto
     * @static
     * @param {IGroupNoticeMsgDto=} [properties] Properties to set
     * @returns {GroupNoticeMsgDto} GroupNoticeMsgDto instance
     */
    GroupNoticeMsgDto.create = function create(properties) {
        return new GroupNoticeMsgDto(properties);
    };

    /**
     * Encodes the specified GroupNoticeMsgDto message. Does not implicitly {@link GroupNoticeMsgDto.verify|verify} messages.
     * @function encode
     * @memberof GroupNoticeMsgDto
     * @static
     * @param {IGroupNoticeMsgDto} message GroupNoticeMsgDto message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupNoticeMsgDto.encode = function encode(message, writer) {
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
     * Encodes the specified GroupNoticeMsgDto message, length delimited. Does not implicitly {@link GroupNoticeMsgDto.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupNoticeMsgDto
     * @static
     * @param {IGroupNoticeMsgDto} message GroupNoticeMsgDto message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupNoticeMsgDto.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupNoticeMsgDto message from the specified reader or buffer.
     * @function decode
     * @memberof GroupNoticeMsgDto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupNoticeMsgDto} GroupNoticeMsgDto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupNoticeMsgDto.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupNoticeMsgDto();
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
     * Decodes a GroupNoticeMsgDto message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupNoticeMsgDto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupNoticeMsgDto} GroupNoticeMsgDto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupNoticeMsgDto.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupNoticeMsgDto message.
     * @function verify
     * @memberof GroupNoticeMsgDto
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupNoticeMsgDto.verify = function verify(message) {
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
     * Creates a GroupNoticeMsgDto message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupNoticeMsgDto
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupNoticeMsgDto} GroupNoticeMsgDto
     */
    GroupNoticeMsgDto.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupNoticeMsgDto)
            return object;
        let message = new $root.GroupNoticeMsgDto();
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
     * Creates a plain object from a GroupNoticeMsgDto message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupNoticeMsgDto
     * @static
     * @param {GroupNoticeMsgDto} message GroupNoticeMsgDto
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupNoticeMsgDto.toObject = function toObject(message, options) {
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
     * Converts this GroupNoticeMsgDto to JSON.
     * @function toJSON
     * @memberof GroupNoticeMsgDto
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupNoticeMsgDto.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupNoticeMsgDto
     * @function getTypeUrl
     * @memberof GroupNoticeMsgDto
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupNoticeMsgDto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupNoticeMsgDto";
    };

    return GroupNoticeMsgDto;
})();

export const GroupForceEventMsgDto = $root.GroupForceEventMsgDto = (() => {

    /**
     * Properties of a GroupForceEventMsgDto.
     * @exports IGroupForceEventMsgDto
     * @interface IGroupForceEventMsgDto
     * @property {ICommonMsgDto|null} [commonMsgDto] GroupForceEventMsgDto commonMsgDto
     */

    /**
     * Constructs a new GroupForceEventMsgDto.
     * @exports GroupForceEventMsgDto
     * @classdesc Represents a GroupForceEventMsgDto.
     * @implements IGroupForceEventMsgDto
     * @constructor
     * @param {IGroupForceEventMsgDto=} [properties] Properties to set
     */
    function GroupForceEventMsgDto(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupForceEventMsgDto commonMsgDto.
     * @member {ICommonMsgDto|null|undefined} commonMsgDto
     * @memberof GroupForceEventMsgDto
     * @instance
     */
    GroupForceEventMsgDto.prototype.commonMsgDto = null;

    /**
     * Creates a new GroupForceEventMsgDto instance using the specified properties.
     * @function create
     * @memberof GroupForceEventMsgDto
     * @static
     * @param {IGroupForceEventMsgDto=} [properties] Properties to set
     * @returns {GroupForceEventMsgDto} GroupForceEventMsgDto instance
     */
    GroupForceEventMsgDto.create = function create(properties) {
        return new GroupForceEventMsgDto(properties);
    };

    /**
     * Encodes the specified GroupForceEventMsgDto message. Does not implicitly {@link GroupForceEventMsgDto.verify|verify} messages.
     * @function encode
     * @memberof GroupForceEventMsgDto
     * @static
     * @param {IGroupForceEventMsgDto} message GroupForceEventMsgDto message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupForceEventMsgDto.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.commonMsgDto != null && Object.hasOwnProperty.call(message, "commonMsgDto"))
            $root.CommonMsgDto.encode(message.commonMsgDto, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified GroupForceEventMsgDto message, length delimited. Does not implicitly {@link GroupForceEventMsgDto.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupForceEventMsgDto
     * @static
     * @param {IGroupForceEventMsgDto} message GroupForceEventMsgDto message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupForceEventMsgDto.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupForceEventMsgDto message from the specified reader or buffer.
     * @function decode
     * @memberof GroupForceEventMsgDto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupForceEventMsgDto} GroupForceEventMsgDto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupForceEventMsgDto.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupForceEventMsgDto();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.commonMsgDto = $root.CommonMsgDto.decode(reader, reader.uint32());
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
     * Decodes a GroupForceEventMsgDto message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupForceEventMsgDto
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupForceEventMsgDto} GroupForceEventMsgDto
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupForceEventMsgDto.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupForceEventMsgDto message.
     * @function verify
     * @memberof GroupForceEventMsgDto
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupForceEventMsgDto.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.commonMsgDto != null && message.hasOwnProperty("commonMsgDto")) {
            let error = $root.CommonMsgDto.verify(message.commonMsgDto);
            if (error)
                return "commonMsgDto." + error;
        }
        return null;
    };

    /**
     * Creates a GroupForceEventMsgDto message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupForceEventMsgDto
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupForceEventMsgDto} GroupForceEventMsgDto
     */
    GroupForceEventMsgDto.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupForceEventMsgDto)
            return object;
        let message = new $root.GroupForceEventMsgDto();
        if (object.commonMsgDto != null) {
            if (typeof object.commonMsgDto !== "object")
                throw TypeError(".GroupForceEventMsgDto.commonMsgDto: object expected");
            message.commonMsgDto = $root.CommonMsgDto.fromObject(object.commonMsgDto);
        }
        return message;
    };

    /**
     * Creates a plain object from a GroupForceEventMsgDto message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupForceEventMsgDto
     * @static
     * @param {GroupForceEventMsgDto} message GroupForceEventMsgDto
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupForceEventMsgDto.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults)
            object.commonMsgDto = null;
        if (message.commonMsgDto != null && message.hasOwnProperty("commonMsgDto"))
            object.commonMsgDto = $root.CommonMsgDto.toObject(message.commonMsgDto, options);
        return object;
    };

    /**
     * Converts this GroupForceEventMsgDto to JSON.
     * @function toJSON
     * @memberof GroupForceEventMsgDto
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupForceEventMsgDto.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupForceEventMsgDto
     * @function getTypeUrl
     * @memberof GroupForceEventMsgDto
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupForceEventMsgDto.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupForceEventMsgDto";
    };

    return GroupForceEventMsgDto;
})();

export const GroupEventReq = $root.GroupEventReq = (() => {

    /**
     * Properties of a GroupEventReq.
     * @exports IGroupEventReq
     * @interface IGroupEventReq
     * @property {IClientInfo|null} [clientInfo] GroupEventReq clientInfo
     * @property {number|Long|null} [groupId] GroupEventReq groupId
     * @property {GroupEventType|null} [eventType] GroupEventReq eventType
     * @property {number|Long|null} [minMsgId] GroupEventReq minMsgId
     * @property {number|Long|null} [maxMsgId] GroupEventReq maxMsgId
     */

    /**
     * Constructs a new GroupEventReq.
     * @exports GroupEventReq
     * @classdesc Represents a GroupEventReq.
     * @implements IGroupEventReq
     * @constructor
     * @param {IGroupEventReq=} [properties] Properties to set
     */
    function GroupEventReq(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupEventReq clientInfo.
     * @member {IClientInfo|null|undefined} clientInfo
     * @memberof GroupEventReq
     * @instance
     */
    GroupEventReq.prototype.clientInfo = null;

    /**
     * GroupEventReq groupId.
     * @member {number|Long} groupId
     * @memberof GroupEventReq
     * @instance
     */
    GroupEventReq.prototype.groupId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupEventReq eventType.
     * @member {GroupEventType} eventType
     * @memberof GroupEventReq
     * @instance
     */
    GroupEventReq.prototype.eventType = 0;

    /**
     * GroupEventReq minMsgId.
     * @member {number|Long} minMsgId
     * @memberof GroupEventReq
     * @instance
     */
    GroupEventReq.prototype.minMsgId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupEventReq maxMsgId.
     * @member {number|Long} maxMsgId
     * @memberof GroupEventReq
     * @instance
     */
    GroupEventReq.prototype.maxMsgId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new GroupEventReq instance using the specified properties.
     * @function create
     * @memberof GroupEventReq
     * @static
     * @param {IGroupEventReq=} [properties] Properties to set
     * @returns {GroupEventReq} GroupEventReq instance
     */
    GroupEventReq.create = function create(properties) {
        return new GroupEventReq(properties);
    };

    /**
     * Encodes the specified GroupEventReq message. Does not implicitly {@link GroupEventReq.verify|verify} messages.
     * @function encode
     * @memberof GroupEventReq
     * @static
     * @param {IGroupEventReq} message GroupEventReq message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupEventReq.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.clientInfo != null && Object.hasOwnProperty.call(message, "clientInfo"))
            $root.ClientInfo.encode(message.clientInfo, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.groupId != null && Object.hasOwnProperty.call(message, "groupId"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.groupId);
        if (message.eventType != null && Object.hasOwnProperty.call(message, "eventType"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.eventType);
        if (message.minMsgId != null && Object.hasOwnProperty.call(message, "minMsgId"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.minMsgId);
        if (message.maxMsgId != null && Object.hasOwnProperty.call(message, "maxMsgId"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.maxMsgId);
        return writer;
    };

    /**
     * Encodes the specified GroupEventReq message, length delimited. Does not implicitly {@link GroupEventReq.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupEventReq
     * @static
     * @param {IGroupEventReq} message GroupEventReq message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupEventReq.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupEventReq message from the specified reader or buffer.
     * @function decode
     * @memberof GroupEventReq
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupEventReq} GroupEventReq
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupEventReq.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupEventReq();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.clientInfo = $root.ClientInfo.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    message.groupId = reader.int64();
                    break;
                }
            case 3: {
                    message.eventType = reader.int32();
                    break;
                }
            case 4: {
                    message.minMsgId = reader.int64();
                    break;
                }
            case 5: {
                    message.maxMsgId = reader.int64();
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
     * Decodes a GroupEventReq message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupEventReq
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupEventReq} GroupEventReq
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupEventReq.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupEventReq message.
     * @function verify
     * @memberof GroupEventReq
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupEventReq.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.clientInfo != null && message.hasOwnProperty("clientInfo")) {
            let error = $root.ClientInfo.verify(message.clientInfo);
            if (error)
                return "clientInfo." + error;
        }
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (!$util.isInteger(message.groupId) && !(message.groupId && $util.isInteger(message.groupId.low) && $util.isInteger(message.groupId.high)))
                return "groupId: integer|Long expected";
        if (message.eventType != null && message.hasOwnProperty("eventType"))
            switch (message.eventType) {
            default:
                return "eventType: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
                break;
            }
        if (message.minMsgId != null && message.hasOwnProperty("minMsgId"))
            if (!$util.isInteger(message.minMsgId) && !(message.minMsgId && $util.isInteger(message.minMsgId.low) && $util.isInteger(message.minMsgId.high)))
                return "minMsgId: integer|Long expected";
        if (message.maxMsgId != null && message.hasOwnProperty("maxMsgId"))
            if (!$util.isInteger(message.maxMsgId) && !(message.maxMsgId && $util.isInteger(message.maxMsgId.low) && $util.isInteger(message.maxMsgId.high)))
                return "maxMsgId: integer|Long expected";
        return null;
    };

    /**
     * Creates a GroupEventReq message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupEventReq
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupEventReq} GroupEventReq
     */
    GroupEventReq.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupEventReq)
            return object;
        let message = new $root.GroupEventReq();
        if (object.clientInfo != null) {
            if (typeof object.clientInfo !== "object")
                throw TypeError(".GroupEventReq.clientInfo: object expected");
            message.clientInfo = $root.ClientInfo.fromObject(object.clientInfo);
        }
        if (object.groupId != null)
            if ($util.Long)
                (message.groupId = $util.Long.fromValue(object.groupId)).unsigned = false;
            else if (typeof object.groupId === "string")
                message.groupId = parseInt(object.groupId, 10);
            else if (typeof object.groupId === "number")
                message.groupId = object.groupId;
            else if (typeof object.groupId === "object")
                message.groupId = new $util.LongBits(object.groupId.low >>> 0, object.groupId.high >>> 0).toNumber();
        switch (object.eventType) {
        default:
            if (typeof object.eventType === "number") {
                message.eventType = object.eventType;
                break;
            }
            break;
        case "GROUP_EVENT_FORCE_INITIATE":
        case 0:
            message.eventType = 0;
            break;
        case "GROUP_EVENT_BROADCAST":
        case 1:
            message.eventType = 1;
            break;
        case "GROUP_EVENT_UNICAST":
        case 2:
            message.eventType = 2;
            break;
        case "GROUP_EVENT_UPDATE":
        case 3:
            message.eventType = 3;
            break;
        case "GROUP_EVENT_FORCE_DESTROY":
        case 4:
            message.eventType = 4;
            break;
        }
        if (object.minMsgId != null)
            if ($util.Long)
                (message.minMsgId = $util.Long.fromValue(object.minMsgId)).unsigned = false;
            else if (typeof object.minMsgId === "string")
                message.minMsgId = parseInt(object.minMsgId, 10);
            else if (typeof object.minMsgId === "number")
                message.minMsgId = object.minMsgId;
            else if (typeof object.minMsgId === "object")
                message.minMsgId = new $util.LongBits(object.minMsgId.low >>> 0, object.minMsgId.high >>> 0).toNumber();
        if (object.maxMsgId != null)
            if ($util.Long)
                (message.maxMsgId = $util.Long.fromValue(object.maxMsgId)).unsigned = false;
            else if (typeof object.maxMsgId === "string")
                message.maxMsgId = parseInt(object.maxMsgId, 10);
            else if (typeof object.maxMsgId === "number")
                message.maxMsgId = object.maxMsgId;
            else if (typeof object.maxMsgId === "object")
                message.maxMsgId = new $util.LongBits(object.maxMsgId.low >>> 0, object.maxMsgId.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a GroupEventReq message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupEventReq
     * @static
     * @param {GroupEventReq} message GroupEventReq
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupEventReq.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.clientInfo = null;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.groupId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.groupId = options.longs === String ? "0" : 0;
            object.eventType = options.enums === String ? "GROUP_EVENT_FORCE_INITIATE" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.minMsgId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.minMsgId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.maxMsgId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.maxMsgId = options.longs === String ? "0" : 0;
        }
        if (message.clientInfo != null && message.hasOwnProperty("clientInfo"))
            object.clientInfo = $root.ClientInfo.toObject(message.clientInfo, options);
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (typeof message.groupId === "number")
                object.groupId = options.longs === String ? String(message.groupId) : message.groupId;
            else
                object.groupId = options.longs === String ? $util.Long.prototype.toString.call(message.groupId) : options.longs === Number ? new $util.LongBits(message.groupId.low >>> 0, message.groupId.high >>> 0).toNumber() : message.groupId;
        if (message.eventType != null && message.hasOwnProperty("eventType"))
            object.eventType = options.enums === String ? $root.GroupEventType[message.eventType] === undefined ? message.eventType : $root.GroupEventType[message.eventType] : message.eventType;
        if (message.minMsgId != null && message.hasOwnProperty("minMsgId"))
            if (typeof message.minMsgId === "number")
                object.minMsgId = options.longs === String ? String(message.minMsgId) : message.minMsgId;
            else
                object.minMsgId = options.longs === String ? $util.Long.prototype.toString.call(message.minMsgId) : options.longs === Number ? new $util.LongBits(message.minMsgId.low >>> 0, message.minMsgId.high >>> 0).toNumber() : message.minMsgId;
        if (message.maxMsgId != null && message.hasOwnProperty("maxMsgId"))
            if (typeof message.maxMsgId === "number")
                object.maxMsgId = options.longs === String ? String(message.maxMsgId) : message.maxMsgId;
            else
                object.maxMsgId = options.longs === String ? $util.Long.prototype.toString.call(message.maxMsgId) : options.longs === Number ? new $util.LongBits(message.maxMsgId.low >>> 0, message.maxMsgId.high >>> 0).toNumber() : message.maxMsgId;
        return object;
    };

    /**
     * Converts this GroupEventReq to JSON.
     * @function toJSON
     * @memberof GroupEventReq
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupEventReq.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupEventReq
     * @function getTypeUrl
     * @memberof GroupEventReq
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupEventReq.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupEventReq";
    };

    return GroupEventReq;
})();

export const GroupEventResp = $root.GroupEventResp = (() => {

    /**
     * Properties of a GroupEventResp.
     * @exports IGroupEventResp
     * @interface IGroupEventResp
     * @property {ICommonResult|null} [commonResult] GroupEventResp commonResult
     * @property {Array.<IGroupUpdateEventMsgDto>|null} [groupUpdateEventMsgDto] GroupEventResp groupUpdateEventMsgDto
     * @property {Array.<IGroupReqEventMsgDto>|null} [groupReqEventMsgDto] GroupEventResp groupReqEventMsgDto
     */

    /**
     * Constructs a new GroupEventResp.
     * @exports GroupEventResp
     * @classdesc Represents a GroupEventResp.
     * @implements IGroupEventResp
     * @constructor
     * @param {IGroupEventResp=} [properties] Properties to set
     */
    function GroupEventResp(properties) {
        this.groupUpdateEventMsgDto = [];
        this.groupReqEventMsgDto = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupEventResp commonResult.
     * @member {ICommonResult|null|undefined} commonResult
     * @memberof GroupEventResp
     * @instance
     */
    GroupEventResp.prototype.commonResult = null;

    /**
     * GroupEventResp groupUpdateEventMsgDto.
     * @member {Array.<IGroupUpdateEventMsgDto>} groupUpdateEventMsgDto
     * @memberof GroupEventResp
     * @instance
     */
    GroupEventResp.prototype.groupUpdateEventMsgDto = $util.emptyArray;

    /**
     * GroupEventResp groupReqEventMsgDto.
     * @member {Array.<IGroupReqEventMsgDto>} groupReqEventMsgDto
     * @memberof GroupEventResp
     * @instance
     */
    GroupEventResp.prototype.groupReqEventMsgDto = $util.emptyArray;

    /**
     * Creates a new GroupEventResp instance using the specified properties.
     * @function create
     * @memberof GroupEventResp
     * @static
     * @param {IGroupEventResp=} [properties] Properties to set
     * @returns {GroupEventResp} GroupEventResp instance
     */
    GroupEventResp.create = function create(properties) {
        return new GroupEventResp(properties);
    };

    /**
     * Encodes the specified GroupEventResp message. Does not implicitly {@link GroupEventResp.verify|verify} messages.
     * @function encode
     * @memberof GroupEventResp
     * @static
     * @param {IGroupEventResp} message GroupEventResp message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupEventResp.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.commonResult != null && Object.hasOwnProperty.call(message, "commonResult"))
            $root.CommonResult.encode(message.commonResult, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.groupUpdateEventMsgDto != null && message.groupUpdateEventMsgDto.length)
            for (let i = 0; i < message.groupUpdateEventMsgDto.length; ++i)
                $root.GroupUpdateEventMsgDto.encode(message.groupUpdateEventMsgDto[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        if (message.groupReqEventMsgDto != null && message.groupReqEventMsgDto.length)
            for (let i = 0; i < message.groupReqEventMsgDto.length; ++i)
                $root.GroupReqEventMsgDto.encode(message.groupReqEventMsgDto[i], writer.uint32(/* id 3, wireType 2 =*/26).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified GroupEventResp message, length delimited. Does not implicitly {@link GroupEventResp.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupEventResp
     * @static
     * @param {IGroupEventResp} message GroupEventResp message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupEventResp.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupEventResp message from the specified reader or buffer.
     * @function decode
     * @memberof GroupEventResp
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupEventResp} GroupEventResp
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupEventResp.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupEventResp();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.commonResult = $root.CommonResult.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    if (!(message.groupUpdateEventMsgDto && message.groupUpdateEventMsgDto.length))
                        message.groupUpdateEventMsgDto = [];
                    message.groupUpdateEventMsgDto.push($root.GroupUpdateEventMsgDto.decode(reader, reader.uint32()));
                    break;
                }
            case 3: {
                    if (!(message.groupReqEventMsgDto && message.groupReqEventMsgDto.length))
                        message.groupReqEventMsgDto = [];
                    message.groupReqEventMsgDto.push($root.GroupReqEventMsgDto.decode(reader, reader.uint32()));
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
     * Decodes a GroupEventResp message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupEventResp
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupEventResp} GroupEventResp
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupEventResp.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupEventResp message.
     * @function verify
     * @memberof GroupEventResp
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupEventResp.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.commonResult != null && message.hasOwnProperty("commonResult")) {
            let error = $root.CommonResult.verify(message.commonResult);
            if (error)
                return "commonResult." + error;
        }
        if (message.groupUpdateEventMsgDto != null && message.hasOwnProperty("groupUpdateEventMsgDto")) {
            if (!Array.isArray(message.groupUpdateEventMsgDto))
                return "groupUpdateEventMsgDto: array expected";
            for (let i = 0; i < message.groupUpdateEventMsgDto.length; ++i) {
                let error = $root.GroupUpdateEventMsgDto.verify(message.groupUpdateEventMsgDto[i]);
                if (error)
                    return "groupUpdateEventMsgDto." + error;
            }
        }
        if (message.groupReqEventMsgDto != null && message.hasOwnProperty("groupReqEventMsgDto")) {
            if (!Array.isArray(message.groupReqEventMsgDto))
                return "groupReqEventMsgDto: array expected";
            for (let i = 0; i < message.groupReqEventMsgDto.length; ++i) {
                let error = $root.GroupReqEventMsgDto.verify(message.groupReqEventMsgDto[i]);
                if (error)
                    return "groupReqEventMsgDto." + error;
            }
        }
        return null;
    };

    /**
     * Creates a GroupEventResp message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupEventResp
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupEventResp} GroupEventResp
     */
    GroupEventResp.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupEventResp)
            return object;
        let message = new $root.GroupEventResp();
        if (object.commonResult != null) {
            if (typeof object.commonResult !== "object")
                throw TypeError(".GroupEventResp.commonResult: object expected");
            message.commonResult = $root.CommonResult.fromObject(object.commonResult);
        }
        if (object.groupUpdateEventMsgDto) {
            if (!Array.isArray(object.groupUpdateEventMsgDto))
                throw TypeError(".GroupEventResp.groupUpdateEventMsgDto: array expected");
            message.groupUpdateEventMsgDto = [];
            for (let i = 0; i < object.groupUpdateEventMsgDto.length; ++i) {
                if (typeof object.groupUpdateEventMsgDto[i] !== "object")
                    throw TypeError(".GroupEventResp.groupUpdateEventMsgDto: object expected");
                message.groupUpdateEventMsgDto[i] = $root.GroupUpdateEventMsgDto.fromObject(object.groupUpdateEventMsgDto[i]);
            }
        }
        if (object.groupReqEventMsgDto) {
            if (!Array.isArray(object.groupReqEventMsgDto))
                throw TypeError(".GroupEventResp.groupReqEventMsgDto: array expected");
            message.groupReqEventMsgDto = [];
            for (let i = 0; i < object.groupReqEventMsgDto.length; ++i) {
                if (typeof object.groupReqEventMsgDto[i] !== "object")
                    throw TypeError(".GroupEventResp.groupReqEventMsgDto: object expected");
                message.groupReqEventMsgDto[i] = $root.GroupReqEventMsgDto.fromObject(object.groupReqEventMsgDto[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a GroupEventResp message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupEventResp
     * @static
     * @param {GroupEventResp} message GroupEventResp
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupEventResp.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.arrays || options.defaults) {
            object.groupUpdateEventMsgDto = [];
            object.groupReqEventMsgDto = [];
        }
        if (options.defaults)
            object.commonResult = null;
        if (message.commonResult != null && message.hasOwnProperty("commonResult"))
            object.commonResult = $root.CommonResult.toObject(message.commonResult, options);
        if (message.groupUpdateEventMsgDto && message.groupUpdateEventMsgDto.length) {
            object.groupUpdateEventMsgDto = [];
            for (let j = 0; j < message.groupUpdateEventMsgDto.length; ++j)
                object.groupUpdateEventMsgDto[j] = $root.GroupUpdateEventMsgDto.toObject(message.groupUpdateEventMsgDto[j], options);
        }
        if (message.groupReqEventMsgDto && message.groupReqEventMsgDto.length) {
            object.groupReqEventMsgDto = [];
            for (let j = 0; j < message.groupReqEventMsgDto.length; ++j)
                object.groupReqEventMsgDto[j] = $root.GroupReqEventMsgDto.toObject(message.groupReqEventMsgDto[j], options);
        }
        return object;
    };

    /**
     * Converts this GroupEventResp to JSON.
     * @function toJSON
     * @memberof GroupEventResp
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupEventResp.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupEventResp
     * @function getTypeUrl
     * @memberof GroupEventResp
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupEventResp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupEventResp";
    };

    return GroupEventResp;
})();

export const GroupEventLatestReq = $root.GroupEventLatestReq = (() => {

    /**
     * Properties of a GroupEventLatestReq.
     * @exports IGroupEventLatestReq
     * @interface IGroupEventLatestReq
     * @property {IClientInfo|null} [clientInfo] GroupEventLatestReq clientInfo
     * @property {number|Long|null} [groupId] GroupEventLatestReq groupId
     */

    /**
     * Constructs a new GroupEventLatestReq.
     * @exports GroupEventLatestReq
     * @classdesc Represents a GroupEventLatestReq.
     * @implements IGroupEventLatestReq
     * @constructor
     * @param {IGroupEventLatestReq=} [properties] Properties to set
     */
    function GroupEventLatestReq(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupEventLatestReq clientInfo.
     * @member {IClientInfo|null|undefined} clientInfo
     * @memberof GroupEventLatestReq
     * @instance
     */
    GroupEventLatestReq.prototype.clientInfo = null;

    /**
     * GroupEventLatestReq groupId.
     * @member {number|Long} groupId
     * @memberof GroupEventLatestReq
     * @instance
     */
    GroupEventLatestReq.prototype.groupId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new GroupEventLatestReq instance using the specified properties.
     * @function create
     * @memberof GroupEventLatestReq
     * @static
     * @param {IGroupEventLatestReq=} [properties] Properties to set
     * @returns {GroupEventLatestReq} GroupEventLatestReq instance
     */
    GroupEventLatestReq.create = function create(properties) {
        return new GroupEventLatestReq(properties);
    };

    /**
     * Encodes the specified GroupEventLatestReq message. Does not implicitly {@link GroupEventLatestReq.verify|verify} messages.
     * @function encode
     * @memberof GroupEventLatestReq
     * @static
     * @param {IGroupEventLatestReq} message GroupEventLatestReq message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupEventLatestReq.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.clientInfo != null && Object.hasOwnProperty.call(message, "clientInfo"))
            $root.ClientInfo.encode(message.clientInfo, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.groupId != null && Object.hasOwnProperty.call(message, "groupId"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.groupId);
        return writer;
    };

    /**
     * Encodes the specified GroupEventLatestReq message, length delimited. Does not implicitly {@link GroupEventLatestReq.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupEventLatestReq
     * @static
     * @param {IGroupEventLatestReq} message GroupEventLatestReq message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupEventLatestReq.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupEventLatestReq message from the specified reader or buffer.
     * @function decode
     * @memberof GroupEventLatestReq
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupEventLatestReq} GroupEventLatestReq
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupEventLatestReq.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupEventLatestReq();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.clientInfo = $root.ClientInfo.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    message.groupId = reader.int64();
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
     * Decodes a GroupEventLatestReq message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupEventLatestReq
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupEventLatestReq} GroupEventLatestReq
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupEventLatestReq.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupEventLatestReq message.
     * @function verify
     * @memberof GroupEventLatestReq
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupEventLatestReq.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.clientInfo != null && message.hasOwnProperty("clientInfo")) {
            let error = $root.ClientInfo.verify(message.clientInfo);
            if (error)
                return "clientInfo." + error;
        }
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (!$util.isInteger(message.groupId) && !(message.groupId && $util.isInteger(message.groupId.low) && $util.isInteger(message.groupId.high)))
                return "groupId: integer|Long expected";
        return null;
    };

    /**
     * Creates a GroupEventLatestReq message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupEventLatestReq
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupEventLatestReq} GroupEventLatestReq
     */
    GroupEventLatestReq.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupEventLatestReq)
            return object;
        let message = new $root.GroupEventLatestReq();
        if (object.clientInfo != null) {
            if (typeof object.clientInfo !== "object")
                throw TypeError(".GroupEventLatestReq.clientInfo: object expected");
            message.clientInfo = $root.ClientInfo.fromObject(object.clientInfo);
        }
        if (object.groupId != null)
            if ($util.Long)
                (message.groupId = $util.Long.fromValue(object.groupId)).unsigned = false;
            else if (typeof object.groupId === "string")
                message.groupId = parseInt(object.groupId, 10);
            else if (typeof object.groupId === "number")
                message.groupId = object.groupId;
            else if (typeof object.groupId === "object")
                message.groupId = new $util.LongBits(object.groupId.low >>> 0, object.groupId.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a GroupEventLatestReq message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupEventLatestReq
     * @static
     * @param {GroupEventLatestReq} message GroupEventLatestReq
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupEventLatestReq.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.clientInfo = null;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.groupId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.groupId = options.longs === String ? "0" : 0;
        }
        if (message.clientInfo != null && message.hasOwnProperty("clientInfo"))
            object.clientInfo = $root.ClientInfo.toObject(message.clientInfo, options);
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (typeof message.groupId === "number")
                object.groupId = options.longs === String ? String(message.groupId) : message.groupId;
            else
                object.groupId = options.longs === String ? $util.Long.prototype.toString.call(message.groupId) : options.longs === Number ? new $util.LongBits(message.groupId.low >>> 0, message.groupId.high >>> 0).toNumber() : message.groupId;
        return object;
    };

    /**
     * Converts this GroupEventLatestReq to JSON.
     * @function toJSON
     * @memberof GroupEventLatestReq
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupEventLatestReq.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupEventLatestReq
     * @function getTypeUrl
     * @memberof GroupEventLatestReq
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupEventLatestReq.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupEventLatestReq";
    };

    return GroupEventLatestReq;
})();

export const GroupEventLatestResp = $root.GroupEventLatestResp = (() => {

    /**
     * Properties of a GroupEventLatestResp.
     * @exports IGroupEventLatestResp
     * @interface IGroupEventLatestResp
     * @property {ICommonResult|null} [commonResult] GroupEventLatestResp commonResult
     * @property {number|Long|null} [broadcastMaxMsgId] GroupEventLatestResp broadcastMaxMsgId
     * @property {number|Long|null} [unicastMaxMsgId] GroupEventLatestResp unicastMaxMsgId
     * @property {number|Long|null} [updateMaxMsgId] GroupEventLatestResp updateMaxMsgId
     */

    /**
     * Constructs a new GroupEventLatestResp.
     * @exports GroupEventLatestResp
     * @classdesc Represents a GroupEventLatestResp.
     * @implements IGroupEventLatestResp
     * @constructor
     * @param {IGroupEventLatestResp=} [properties] Properties to set
     */
    function GroupEventLatestResp(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupEventLatestResp commonResult.
     * @member {ICommonResult|null|undefined} commonResult
     * @memberof GroupEventLatestResp
     * @instance
     */
    GroupEventLatestResp.prototype.commonResult = null;

    /**
     * GroupEventLatestResp broadcastMaxMsgId.
     * @member {number|Long} broadcastMaxMsgId
     * @memberof GroupEventLatestResp
     * @instance
     */
    GroupEventLatestResp.prototype.broadcastMaxMsgId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupEventLatestResp unicastMaxMsgId.
     * @member {number|Long} unicastMaxMsgId
     * @memberof GroupEventLatestResp
     * @instance
     */
    GroupEventLatestResp.prototype.unicastMaxMsgId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupEventLatestResp updateMaxMsgId.
     * @member {number|Long} updateMaxMsgId
     * @memberof GroupEventLatestResp
     * @instance
     */
    GroupEventLatestResp.prototype.updateMaxMsgId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new GroupEventLatestResp instance using the specified properties.
     * @function create
     * @memberof GroupEventLatestResp
     * @static
     * @param {IGroupEventLatestResp=} [properties] Properties to set
     * @returns {GroupEventLatestResp} GroupEventLatestResp instance
     */
    GroupEventLatestResp.create = function create(properties) {
        return new GroupEventLatestResp(properties);
    };

    /**
     * Encodes the specified GroupEventLatestResp message. Does not implicitly {@link GroupEventLatestResp.verify|verify} messages.
     * @function encode
     * @memberof GroupEventLatestResp
     * @static
     * @param {IGroupEventLatestResp} message GroupEventLatestResp message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupEventLatestResp.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.commonResult != null && Object.hasOwnProperty.call(message, "commonResult"))
            $root.CommonResult.encode(message.commonResult, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.broadcastMaxMsgId != null && Object.hasOwnProperty.call(message, "broadcastMaxMsgId"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.broadcastMaxMsgId);
        if (message.unicastMaxMsgId != null && Object.hasOwnProperty.call(message, "unicastMaxMsgId"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.unicastMaxMsgId);
        if (message.updateMaxMsgId != null && Object.hasOwnProperty.call(message, "updateMaxMsgId"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.updateMaxMsgId);
        return writer;
    };

    /**
     * Encodes the specified GroupEventLatestResp message, length delimited. Does not implicitly {@link GroupEventLatestResp.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupEventLatestResp
     * @static
     * @param {IGroupEventLatestResp} message GroupEventLatestResp message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupEventLatestResp.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupEventLatestResp message from the specified reader or buffer.
     * @function decode
     * @memberof GroupEventLatestResp
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupEventLatestResp} GroupEventLatestResp
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupEventLatestResp.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupEventLatestResp();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.commonResult = $root.CommonResult.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    message.broadcastMaxMsgId = reader.int64();
                    break;
                }
            case 3: {
                    message.unicastMaxMsgId = reader.int64();
                    break;
                }
            case 4: {
                    message.updateMaxMsgId = reader.int64();
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
     * Decodes a GroupEventLatestResp message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupEventLatestResp
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupEventLatestResp} GroupEventLatestResp
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupEventLatestResp.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupEventLatestResp message.
     * @function verify
     * @memberof GroupEventLatestResp
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupEventLatestResp.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.commonResult != null && message.hasOwnProperty("commonResult")) {
            let error = $root.CommonResult.verify(message.commonResult);
            if (error)
                return "commonResult." + error;
        }
        if (message.broadcastMaxMsgId != null && message.hasOwnProperty("broadcastMaxMsgId"))
            if (!$util.isInteger(message.broadcastMaxMsgId) && !(message.broadcastMaxMsgId && $util.isInteger(message.broadcastMaxMsgId.low) && $util.isInteger(message.broadcastMaxMsgId.high)))
                return "broadcastMaxMsgId: integer|Long expected";
        if (message.unicastMaxMsgId != null && message.hasOwnProperty("unicastMaxMsgId"))
            if (!$util.isInteger(message.unicastMaxMsgId) && !(message.unicastMaxMsgId && $util.isInteger(message.unicastMaxMsgId.low) && $util.isInteger(message.unicastMaxMsgId.high)))
                return "unicastMaxMsgId: integer|Long expected";
        if (message.updateMaxMsgId != null && message.hasOwnProperty("updateMaxMsgId"))
            if (!$util.isInteger(message.updateMaxMsgId) && !(message.updateMaxMsgId && $util.isInteger(message.updateMaxMsgId.low) && $util.isInteger(message.updateMaxMsgId.high)))
                return "updateMaxMsgId: integer|Long expected";
        return null;
    };

    /**
     * Creates a GroupEventLatestResp message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupEventLatestResp
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupEventLatestResp} GroupEventLatestResp
     */
    GroupEventLatestResp.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupEventLatestResp)
            return object;
        let message = new $root.GroupEventLatestResp();
        if (object.commonResult != null) {
            if (typeof object.commonResult !== "object")
                throw TypeError(".GroupEventLatestResp.commonResult: object expected");
            message.commonResult = $root.CommonResult.fromObject(object.commonResult);
        }
        if (object.broadcastMaxMsgId != null)
            if ($util.Long)
                (message.broadcastMaxMsgId = $util.Long.fromValue(object.broadcastMaxMsgId)).unsigned = false;
            else if (typeof object.broadcastMaxMsgId === "string")
                message.broadcastMaxMsgId = parseInt(object.broadcastMaxMsgId, 10);
            else if (typeof object.broadcastMaxMsgId === "number")
                message.broadcastMaxMsgId = object.broadcastMaxMsgId;
            else if (typeof object.broadcastMaxMsgId === "object")
                message.broadcastMaxMsgId = new $util.LongBits(object.broadcastMaxMsgId.low >>> 0, object.broadcastMaxMsgId.high >>> 0).toNumber();
        if (object.unicastMaxMsgId != null)
            if ($util.Long)
                (message.unicastMaxMsgId = $util.Long.fromValue(object.unicastMaxMsgId)).unsigned = false;
            else if (typeof object.unicastMaxMsgId === "string")
                message.unicastMaxMsgId = parseInt(object.unicastMaxMsgId, 10);
            else if (typeof object.unicastMaxMsgId === "number")
                message.unicastMaxMsgId = object.unicastMaxMsgId;
            else if (typeof object.unicastMaxMsgId === "object")
                message.unicastMaxMsgId = new $util.LongBits(object.unicastMaxMsgId.low >>> 0, object.unicastMaxMsgId.high >>> 0).toNumber();
        if (object.updateMaxMsgId != null)
            if ($util.Long)
                (message.updateMaxMsgId = $util.Long.fromValue(object.updateMaxMsgId)).unsigned = false;
            else if (typeof object.updateMaxMsgId === "string")
                message.updateMaxMsgId = parseInt(object.updateMaxMsgId, 10);
            else if (typeof object.updateMaxMsgId === "number")
                message.updateMaxMsgId = object.updateMaxMsgId;
            else if (typeof object.updateMaxMsgId === "object")
                message.updateMaxMsgId = new $util.LongBits(object.updateMaxMsgId.low >>> 0, object.updateMaxMsgId.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a GroupEventLatestResp message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupEventLatestResp
     * @static
     * @param {GroupEventLatestResp} message GroupEventLatestResp
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupEventLatestResp.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.commonResult = null;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.broadcastMaxMsgId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.broadcastMaxMsgId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.unicastMaxMsgId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.unicastMaxMsgId = options.longs === String ? "0" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.updateMaxMsgId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.updateMaxMsgId = options.longs === String ? "0" : 0;
        }
        if (message.commonResult != null && message.hasOwnProperty("commonResult"))
            object.commonResult = $root.CommonResult.toObject(message.commonResult, options);
        if (message.broadcastMaxMsgId != null && message.hasOwnProperty("broadcastMaxMsgId"))
            if (typeof message.broadcastMaxMsgId === "number")
                object.broadcastMaxMsgId = options.longs === String ? String(message.broadcastMaxMsgId) : message.broadcastMaxMsgId;
            else
                object.broadcastMaxMsgId = options.longs === String ? $util.Long.prototype.toString.call(message.broadcastMaxMsgId) : options.longs === Number ? new $util.LongBits(message.broadcastMaxMsgId.low >>> 0, message.broadcastMaxMsgId.high >>> 0).toNumber() : message.broadcastMaxMsgId;
        if (message.unicastMaxMsgId != null && message.hasOwnProperty("unicastMaxMsgId"))
            if (typeof message.unicastMaxMsgId === "number")
                object.unicastMaxMsgId = options.longs === String ? String(message.unicastMaxMsgId) : message.unicastMaxMsgId;
            else
                object.unicastMaxMsgId = options.longs === String ? $util.Long.prototype.toString.call(message.unicastMaxMsgId) : options.longs === Number ? new $util.LongBits(message.unicastMaxMsgId.low >>> 0, message.unicastMaxMsgId.high >>> 0).toNumber() : message.unicastMaxMsgId;
        if (message.updateMaxMsgId != null && message.hasOwnProperty("updateMaxMsgId"))
            if (typeof message.updateMaxMsgId === "number")
                object.updateMaxMsgId = options.longs === String ? String(message.updateMaxMsgId) : message.updateMaxMsgId;
            else
                object.updateMaxMsgId = options.longs === String ? $util.Long.prototype.toString.call(message.updateMaxMsgId) : options.longs === Number ? new $util.LongBits(message.updateMaxMsgId.low >>> 0, message.updateMaxMsgId.high >>> 0).toNumber() : message.updateMaxMsgId;
        return object;
    };

    /**
     * Converts this GroupEventLatestResp to JSON.
     * @function toJSON
     * @memberof GroupEventLatestResp
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupEventLatestResp.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupEventLatestResp
     * @function getTypeUrl
     * @memberof GroupEventLatestResp
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupEventLatestResp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupEventLatestResp";
    };

    return GroupEventLatestResp;
})();

export const GroupEventForceInitReq = $root.GroupEventForceInitReq = (() => {

    /**
     * Properties of a GroupEventForceInitReq.
     * @exports IGroupEventForceInitReq
     * @interface IGroupEventForceInitReq
     * @property {IClientInfo|null} [clientInfo] GroupEventForceInitReq clientInfo
     * @property {Array.<number|Long>|null} [groupIds] GroupEventForceInitReq groupIds
     */

    /**
     * Constructs a new GroupEventForceInitReq.
     * @exports GroupEventForceInitReq
     * @classdesc Represents a GroupEventForceInitReq.
     * @implements IGroupEventForceInitReq
     * @constructor
     * @param {IGroupEventForceInitReq=} [properties] Properties to set
     */
    function GroupEventForceInitReq(properties) {
        this.groupIds = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupEventForceInitReq clientInfo.
     * @member {IClientInfo|null|undefined} clientInfo
     * @memberof GroupEventForceInitReq
     * @instance
     */
    GroupEventForceInitReq.prototype.clientInfo = null;

    /**
     * GroupEventForceInitReq groupIds.
     * @member {Array.<number|Long>} groupIds
     * @memberof GroupEventForceInitReq
     * @instance
     */
    GroupEventForceInitReq.prototype.groupIds = $util.emptyArray;

    /**
     * Creates a new GroupEventForceInitReq instance using the specified properties.
     * @function create
     * @memberof GroupEventForceInitReq
     * @static
     * @param {IGroupEventForceInitReq=} [properties] Properties to set
     * @returns {GroupEventForceInitReq} GroupEventForceInitReq instance
     */
    GroupEventForceInitReq.create = function create(properties) {
        return new GroupEventForceInitReq(properties);
    };

    /**
     * Encodes the specified GroupEventForceInitReq message. Does not implicitly {@link GroupEventForceInitReq.verify|verify} messages.
     * @function encode
     * @memberof GroupEventForceInitReq
     * @static
     * @param {IGroupEventForceInitReq} message GroupEventForceInitReq message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupEventForceInitReq.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.clientInfo != null && Object.hasOwnProperty.call(message, "clientInfo"))
            $root.ClientInfo.encode(message.clientInfo, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.groupIds != null && message.groupIds.length) {
            writer.uint32(/* id 2, wireType 2 =*/18).fork();
            for (let i = 0; i < message.groupIds.length; ++i)
                writer.int64(message.groupIds[i]);
            writer.ldelim();
        }
        return writer;
    };

    /**
     * Encodes the specified GroupEventForceInitReq message, length delimited. Does not implicitly {@link GroupEventForceInitReq.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupEventForceInitReq
     * @static
     * @param {IGroupEventForceInitReq} message GroupEventForceInitReq message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupEventForceInitReq.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupEventForceInitReq message from the specified reader or buffer.
     * @function decode
     * @memberof GroupEventForceInitReq
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupEventForceInitReq} GroupEventForceInitReq
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupEventForceInitReq.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupEventForceInitReq();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.clientInfo = $root.ClientInfo.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    if (!(message.groupIds && message.groupIds.length))
                        message.groupIds = [];
                    if ((tag & 7) === 2) {
                        let end2 = reader.uint32() + reader.pos;
                        while (reader.pos < end2)
                            message.groupIds.push(reader.int64());
                    } else
                        message.groupIds.push(reader.int64());
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
     * Decodes a GroupEventForceInitReq message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupEventForceInitReq
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupEventForceInitReq} GroupEventForceInitReq
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupEventForceInitReq.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupEventForceInitReq message.
     * @function verify
     * @memberof GroupEventForceInitReq
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupEventForceInitReq.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.clientInfo != null && message.hasOwnProperty("clientInfo")) {
            let error = $root.ClientInfo.verify(message.clientInfo);
            if (error)
                return "clientInfo." + error;
        }
        if (message.groupIds != null && message.hasOwnProperty("groupIds")) {
            if (!Array.isArray(message.groupIds))
                return "groupIds: array expected";
            for (let i = 0; i < message.groupIds.length; ++i)
                if (!$util.isInteger(message.groupIds[i]) && !(message.groupIds[i] && $util.isInteger(message.groupIds[i].low) && $util.isInteger(message.groupIds[i].high)))
                    return "groupIds: integer|Long[] expected";
        }
        return null;
    };

    /**
     * Creates a GroupEventForceInitReq message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupEventForceInitReq
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupEventForceInitReq} GroupEventForceInitReq
     */
    GroupEventForceInitReq.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupEventForceInitReq)
            return object;
        let message = new $root.GroupEventForceInitReq();
        if (object.clientInfo != null) {
            if (typeof object.clientInfo !== "object")
                throw TypeError(".GroupEventForceInitReq.clientInfo: object expected");
            message.clientInfo = $root.ClientInfo.fromObject(object.clientInfo);
        }
        if (object.groupIds) {
            if (!Array.isArray(object.groupIds))
                throw TypeError(".GroupEventForceInitReq.groupIds: array expected");
            message.groupIds = [];
            for (let i = 0; i < object.groupIds.length; ++i)
                if ($util.Long)
                    (message.groupIds[i] = $util.Long.fromValue(object.groupIds[i])).unsigned = false;
                else if (typeof object.groupIds[i] === "string")
                    message.groupIds[i] = parseInt(object.groupIds[i], 10);
                else if (typeof object.groupIds[i] === "number")
                    message.groupIds[i] = object.groupIds[i];
                else if (typeof object.groupIds[i] === "object")
                    message.groupIds[i] = new $util.LongBits(object.groupIds[i].low >>> 0, object.groupIds[i].high >>> 0).toNumber();
        }
        return message;
    };

    /**
     * Creates a plain object from a GroupEventForceInitReq message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupEventForceInitReq
     * @static
     * @param {GroupEventForceInitReq} message GroupEventForceInitReq
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupEventForceInitReq.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.arrays || options.defaults)
            object.groupIds = [];
        if (options.defaults)
            object.clientInfo = null;
        if (message.clientInfo != null && message.hasOwnProperty("clientInfo"))
            object.clientInfo = $root.ClientInfo.toObject(message.clientInfo, options);
        if (message.groupIds && message.groupIds.length) {
            object.groupIds = [];
            for (let j = 0; j < message.groupIds.length; ++j)
                if (typeof message.groupIds[j] === "number")
                    object.groupIds[j] = options.longs === String ? String(message.groupIds[j]) : message.groupIds[j];
                else
                    object.groupIds[j] = options.longs === String ? $util.Long.prototype.toString.call(message.groupIds[j]) : options.longs === Number ? new $util.LongBits(message.groupIds[j].low >>> 0, message.groupIds[j].high >>> 0).toNumber() : message.groupIds[j];
        }
        return object;
    };

    /**
     * Converts this GroupEventForceInitReq to JSON.
     * @function toJSON
     * @memberof GroupEventForceInitReq
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupEventForceInitReq.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupEventForceInitReq
     * @function getTypeUrl
     * @memberof GroupEventForceInitReq
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupEventForceInitReq.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupEventForceInitReq";
    };

    return GroupEventForceInitReq;
})();

export const GroupEventForceInitResp = $root.GroupEventForceInitResp = (() => {

    /**
     * Properties of a GroupEventForceInitResp.
     * @exports IGroupEventForceInitResp
     * @interface IGroupEventForceInitResp
     * @property {ICommonResult|null} [commonResult] GroupEventForceInitResp commonResult
     */

    /**
     * Constructs a new GroupEventForceInitResp.
     * @exports GroupEventForceInitResp
     * @classdesc Represents a GroupEventForceInitResp.
     * @implements IGroupEventForceInitResp
     * @constructor
     * @param {IGroupEventForceInitResp=} [properties] Properties to set
     */
    function GroupEventForceInitResp(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupEventForceInitResp commonResult.
     * @member {ICommonResult|null|undefined} commonResult
     * @memberof GroupEventForceInitResp
     * @instance
     */
    GroupEventForceInitResp.prototype.commonResult = null;

    /**
     * Creates a new GroupEventForceInitResp instance using the specified properties.
     * @function create
     * @memberof GroupEventForceInitResp
     * @static
     * @param {IGroupEventForceInitResp=} [properties] Properties to set
     * @returns {GroupEventForceInitResp} GroupEventForceInitResp instance
     */
    GroupEventForceInitResp.create = function create(properties) {
        return new GroupEventForceInitResp(properties);
    };

    /**
     * Encodes the specified GroupEventForceInitResp message. Does not implicitly {@link GroupEventForceInitResp.verify|verify} messages.
     * @function encode
     * @memberof GroupEventForceInitResp
     * @static
     * @param {IGroupEventForceInitResp} message GroupEventForceInitResp message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupEventForceInitResp.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.commonResult != null && Object.hasOwnProperty.call(message, "commonResult"))
            $root.CommonResult.encode(message.commonResult, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified GroupEventForceInitResp message, length delimited. Does not implicitly {@link GroupEventForceInitResp.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupEventForceInitResp
     * @static
     * @param {IGroupEventForceInitResp} message GroupEventForceInitResp message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupEventForceInitResp.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupEventForceInitResp message from the specified reader or buffer.
     * @function decode
     * @memberof GroupEventForceInitResp
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupEventForceInitResp} GroupEventForceInitResp
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupEventForceInitResp.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupEventForceInitResp();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.commonResult = $root.CommonResult.decode(reader, reader.uint32());
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
     * Decodes a GroupEventForceInitResp message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupEventForceInitResp
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupEventForceInitResp} GroupEventForceInitResp
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupEventForceInitResp.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupEventForceInitResp message.
     * @function verify
     * @memberof GroupEventForceInitResp
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupEventForceInitResp.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.commonResult != null && message.hasOwnProperty("commonResult")) {
            let error = $root.CommonResult.verify(message.commonResult);
            if (error)
                return "commonResult." + error;
        }
        return null;
    };

    /**
     * Creates a GroupEventForceInitResp message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupEventForceInitResp
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupEventForceInitResp} GroupEventForceInitResp
     */
    GroupEventForceInitResp.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupEventForceInitResp)
            return object;
        let message = new $root.GroupEventForceInitResp();
        if (object.commonResult != null) {
            if (typeof object.commonResult !== "object")
                throw TypeError(".GroupEventForceInitResp.commonResult: object expected");
            message.commonResult = $root.CommonResult.fromObject(object.commonResult);
        }
        return message;
    };

    /**
     * Creates a plain object from a GroupEventForceInitResp message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupEventForceInitResp
     * @static
     * @param {GroupEventForceInitResp} message GroupEventForceInitResp
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupEventForceInitResp.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults)
            object.commonResult = null;
        if (message.commonResult != null && message.hasOwnProperty("commonResult"))
            object.commonResult = $root.CommonResult.toObject(message.commonResult, options);
        return object;
    };

    /**
     * Converts this GroupEventForceInitResp to JSON.
     * @function toJSON
     * @memberof GroupEventForceInitResp
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupEventForceInitResp.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupEventForceInitResp
     * @function getTypeUrl
     * @memberof GroupEventForceInitResp
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupEventForceInitResp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupEventForceInitResp";
    };

    return GroupEventForceInitResp;
})();

export const ClientInfo = $root.ClientInfo = (() => {

    /**
     * Properties of a ClientInfo.
     * @exports IClientInfo
     * @interface IClientInfo
     * @property {string|null} [sessionId] ClientInfo sessionId
     * @property {number|null} [appVer] ClientInfo appVer
     * @property {number|null} [packageCode] ClientInfo packageCode
     * @property {Platform|null} [plat] ClientInfo plat
     * @property {number|null} [language] ClientInfo language
     * @property {string|null} [sysMac] ClientInfo sysMac
     * @property {string|null} [sysModel] ClientInfo sysModel
     * @property {string|null} [token] ClientInfo token
     * @property {string|null} [version] ClientInfo version
     */

    /**
     * Constructs a new ClientInfo.
     * @exports ClientInfo
     * @classdesc Represents a ClientInfo.
     * @implements IClientInfo
     * @constructor
     * @param {IClientInfo=} [properties] Properties to set
     */
    function ClientInfo(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ClientInfo sessionId.
     * @member {string} sessionId
     * @memberof ClientInfo
     * @instance
     */
    ClientInfo.prototype.sessionId = "";

    /**
     * ClientInfo appVer.
     * @member {number} appVer
     * @memberof ClientInfo
     * @instance
     */
    ClientInfo.prototype.appVer = 0;

    /**
     * ClientInfo packageCode.
     * @member {number} packageCode
     * @memberof ClientInfo
     * @instance
     */
    ClientInfo.prototype.packageCode = 0;

    /**
     * ClientInfo plat.
     * @member {Platform} plat
     * @memberof ClientInfo
     * @instance
     */
    ClientInfo.prototype.plat = 0;

    /**
     * ClientInfo language.
     * @member {number} language
     * @memberof ClientInfo
     * @instance
     */
    ClientInfo.prototype.language = 0;

    /**
     * ClientInfo sysMac.
     * @member {string} sysMac
     * @memberof ClientInfo
     * @instance
     */
    ClientInfo.prototype.sysMac = "";

    /**
     * ClientInfo sysModel.
     * @member {string} sysModel
     * @memberof ClientInfo
     * @instance
     */
    ClientInfo.prototype.sysModel = "";

    /**
     * ClientInfo token.
     * @member {string} token
     * @memberof ClientInfo
     * @instance
     */
    ClientInfo.prototype.token = "";

    /**
     * ClientInfo version.
     * @member {string} version
     * @memberof ClientInfo
     * @instance
     */
    ClientInfo.prototype.version = "";

    /**
     * Creates a new ClientInfo instance using the specified properties.
     * @function create
     * @memberof ClientInfo
     * @static
     * @param {IClientInfo=} [properties] Properties to set
     * @returns {ClientInfo} ClientInfo instance
     */
    ClientInfo.create = function create(properties) {
        return new ClientInfo(properties);
    };

    /**
     * Encodes the specified ClientInfo message. Does not implicitly {@link ClientInfo.verify|verify} messages.
     * @function encode
     * @memberof ClientInfo
     * @static
     * @param {IClientInfo} message ClientInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ClientInfo.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.sessionId);
        if (message.appVer != null && Object.hasOwnProperty.call(message, "appVer"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.appVer);
        if (message.packageCode != null && Object.hasOwnProperty.call(message, "packageCode"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.packageCode);
        if (message.plat != null && Object.hasOwnProperty.call(message, "plat"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.plat);
        if (message.language != null && Object.hasOwnProperty.call(message, "language"))
            writer.uint32(/* id 5, wireType 0 =*/40).int32(message.language);
        if (message.sysMac != null && Object.hasOwnProperty.call(message, "sysMac"))
            writer.uint32(/* id 6, wireType 2 =*/50).string(message.sysMac);
        if (message.sysModel != null && Object.hasOwnProperty.call(message, "sysModel"))
            writer.uint32(/* id 7, wireType 2 =*/58).string(message.sysModel);
        if (message.token != null && Object.hasOwnProperty.call(message, "token"))
            writer.uint32(/* id 8, wireType 2 =*/66).string(message.token);
        if (message.version != null && Object.hasOwnProperty.call(message, "version"))
            writer.uint32(/* id 9, wireType 2 =*/74).string(message.version);
        return writer;
    };

    /**
     * Encodes the specified ClientInfo message, length delimited. Does not implicitly {@link ClientInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ClientInfo
     * @static
     * @param {IClientInfo} message ClientInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ClientInfo.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ClientInfo message from the specified reader or buffer.
     * @function decode
     * @memberof ClientInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ClientInfo} ClientInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ClientInfo.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.ClientInfo();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.sessionId = reader.string();
                    break;
                }
            case 2: {
                    message.appVer = reader.int32();
                    break;
                }
            case 3: {
                    message.packageCode = reader.int32();
                    break;
                }
            case 4: {
                    message.plat = reader.int32();
                    break;
                }
            case 5: {
                    message.language = reader.int32();
                    break;
                }
            case 6: {
                    message.sysMac = reader.string();
                    break;
                }
            case 7: {
                    message.sysModel = reader.string();
                    break;
                }
            case 8: {
                    message.token = reader.string();
                    break;
                }
            case 9: {
                    message.version = reader.string();
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
     * Decodes a ClientInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ClientInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ClientInfo} ClientInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ClientInfo.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ClientInfo message.
     * @function verify
     * @memberof ClientInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ClientInfo.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.sessionId != null && message.hasOwnProperty("sessionId"))
            if (!$util.isString(message.sessionId))
                return "sessionId: string expected";
        if (message.appVer != null && message.hasOwnProperty("appVer"))
            if (!$util.isInteger(message.appVer))
                return "appVer: integer expected";
        if (message.packageCode != null && message.hasOwnProperty("packageCode"))
            if (!$util.isInteger(message.packageCode))
                return "packageCode: integer expected";
        if (message.plat != null && message.hasOwnProperty("plat"))
            switch (message.plat) {
            default:
                return "plat: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
                break;
            }
        if (message.language != null && message.hasOwnProperty("language"))
            if (!$util.isInteger(message.language))
                return "language: integer expected";
        if (message.sysMac != null && message.hasOwnProperty("sysMac"))
            if (!$util.isString(message.sysMac))
                return "sysMac: string expected";
        if (message.sysModel != null && message.hasOwnProperty("sysModel"))
            if (!$util.isString(message.sysModel))
                return "sysModel: string expected";
        if (message.token != null && message.hasOwnProperty("token"))
            if (!$util.isString(message.token))
                return "token: string expected";
        if (message.version != null && message.hasOwnProperty("version"))
            if (!$util.isString(message.version))
                return "version: string expected";
        return null;
    };

    /**
     * Creates a ClientInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ClientInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ClientInfo} ClientInfo
     */
    ClientInfo.fromObject = function fromObject(object) {
        if (object instanceof $root.ClientInfo)
            return object;
        let message = new $root.ClientInfo();
        if (object.sessionId != null)
            message.sessionId = String(object.sessionId);
        if (object.appVer != null)
            message.appVer = object.appVer | 0;
        if (object.packageCode != null)
            message.packageCode = object.packageCode | 0;
        switch (object.plat) {
        default:
            if (typeof object.plat === "number") {
                message.plat = object.plat;
                break;
            }
            break;
        case "ANDROID":
        case 0:
            message.plat = 0;
            break;
        case "IPHONE":
        case 1:
            message.plat = 1;
            break;
        case "UNKOWN":
        case 2:
            message.plat = 2;
            break;
        case "MAC":
        case 3:
            message.plat = 3;
            break;
        case "WIN":
        case 4:
            message.plat = 4;
            break;
        case "HARMONYOS":
        case 5:
            message.plat = 5;
            break;
        }
        if (object.language != null)
            message.language = object.language | 0;
        if (object.sysMac != null)
            message.sysMac = String(object.sysMac);
        if (object.sysModel != null)
            message.sysModel = String(object.sysModel);
        if (object.token != null)
            message.token = String(object.token);
        if (object.version != null)
            message.version = String(object.version);
        return message;
    };

    /**
     * Creates a plain object from a ClientInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ClientInfo
     * @static
     * @param {ClientInfo} message ClientInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ClientInfo.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.sessionId = "";
            object.appVer = 0;
            object.packageCode = 0;
            object.plat = options.enums === String ? "ANDROID" : 0;
            object.language = 0;
            object.sysMac = "";
            object.sysModel = "";
            object.token = "";
            object.version = "";
        }
        if (message.sessionId != null && message.hasOwnProperty("sessionId"))
            object.sessionId = message.sessionId;
        if (message.appVer != null && message.hasOwnProperty("appVer"))
            object.appVer = message.appVer;
        if (message.packageCode != null && message.hasOwnProperty("packageCode"))
            object.packageCode = message.packageCode;
        if (message.plat != null && message.hasOwnProperty("plat"))
            object.plat = options.enums === String ? $root.Platform[message.plat] === undefined ? message.plat : $root.Platform[message.plat] : message.plat;
        if (message.language != null && message.hasOwnProperty("language"))
            object.language = message.language;
        if (message.sysMac != null && message.hasOwnProperty("sysMac"))
            object.sysMac = message.sysMac;
        if (message.sysModel != null && message.hasOwnProperty("sysModel"))
            object.sysModel = message.sysModel;
        if (message.token != null && message.hasOwnProperty("token"))
            object.token = message.token;
        if (message.version != null && message.hasOwnProperty("version"))
            object.version = message.version;
        return object;
    };

    /**
     * Converts this ClientInfo to JSON.
     * @function toJSON
     * @memberof ClientInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ClientInfo.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ClientInfo
     * @function getTypeUrl
     * @memberof ClientInfo
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ClientInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/ClientInfo";
    };

    return ClientInfo;
})();

export const CommonResult = $root.CommonResult = (() => {

    /**
     * Properties of a CommonResult.
     * @exports ICommonResult
     * @interface ICommonResult
     * @property {number|null} [errCode] CommonResult errCode
     * @property {string|null} [errMsg] CommonResult errMsg
     * @property {string|null} [flag] CommonResult flag
     */

    /**
     * Constructs a new CommonResult.
     * @exports CommonResult
     * @classdesc Represents a CommonResult.
     * @implements ICommonResult
     * @constructor
     * @param {ICommonResult=} [properties] Properties to set
     */
    function CommonResult(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CommonResult errCode.
     * @member {number} errCode
     * @memberof CommonResult
     * @instance
     */
    CommonResult.prototype.errCode = 0;

    /**
     * CommonResult errMsg.
     * @member {string} errMsg
     * @memberof CommonResult
     * @instance
     */
    CommonResult.prototype.errMsg = "";

    /**
     * CommonResult flag.
     * @member {string} flag
     * @memberof CommonResult
     * @instance
     */
    CommonResult.prototype.flag = "";

    /**
     * Creates a new CommonResult instance using the specified properties.
     * @function create
     * @memberof CommonResult
     * @static
     * @param {ICommonResult=} [properties] Properties to set
     * @returns {CommonResult} CommonResult instance
     */
    CommonResult.create = function create(properties) {
        return new CommonResult(properties);
    };

    /**
     * Encodes the specified CommonResult message. Does not implicitly {@link CommonResult.verify|verify} messages.
     * @function encode
     * @memberof CommonResult
     * @static
     * @param {ICommonResult} message CommonResult message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CommonResult.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.errCode != null && Object.hasOwnProperty.call(message, "errCode"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.errCode);
        if (message.errMsg != null && Object.hasOwnProperty.call(message, "errMsg"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.errMsg);
        if (message.flag != null && Object.hasOwnProperty.call(message, "flag"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.flag);
        return writer;
    };

    /**
     * Encodes the specified CommonResult message, length delimited. Does not implicitly {@link CommonResult.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CommonResult
     * @static
     * @param {ICommonResult} message CommonResult message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CommonResult.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CommonResult message from the specified reader or buffer.
     * @function decode
     * @memberof CommonResult
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CommonResult} CommonResult
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CommonResult.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CommonResult();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.errCode = reader.int32();
                    break;
                }
            case 2: {
                    message.errMsg = reader.string();
                    break;
                }
            case 3: {
                    message.flag = reader.string();
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
     * Decodes a CommonResult message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CommonResult
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CommonResult} CommonResult
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CommonResult.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CommonResult message.
     * @function verify
     * @memberof CommonResult
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CommonResult.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.errCode != null && message.hasOwnProperty("errCode"))
            if (!$util.isInteger(message.errCode))
                return "errCode: integer expected";
        if (message.errMsg != null && message.hasOwnProperty("errMsg"))
            if (!$util.isString(message.errMsg))
                return "errMsg: string expected";
        if (message.flag != null && message.hasOwnProperty("flag"))
            if (!$util.isString(message.flag))
                return "flag: string expected";
        return null;
    };

    /**
     * Creates a CommonResult message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CommonResult
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CommonResult} CommonResult
     */
    CommonResult.fromObject = function fromObject(object) {
        if (object instanceof $root.CommonResult)
            return object;
        let message = new $root.CommonResult();
        if (object.errCode != null)
            message.errCode = object.errCode | 0;
        if (object.errMsg != null)
            message.errMsg = String(object.errMsg);
        if (object.flag != null)
            message.flag = String(object.flag);
        return message;
    };

    /**
     * Creates a plain object from a CommonResult message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CommonResult
     * @static
     * @param {CommonResult} message CommonResult
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CommonResult.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.errCode = 0;
            object.errMsg = "";
            object.flag = "";
        }
        if (message.errCode != null && message.hasOwnProperty("errCode"))
            object.errCode = message.errCode;
        if (message.errMsg != null && message.hasOwnProperty("errMsg"))
            object.errMsg = message.errMsg;
        if (message.flag != null && message.hasOwnProperty("flag"))
            object.flag = message.flag;
        return object;
    };

    /**
     * Converts this CommonResult to JSON.
     * @function toJSON
     * @memberof CommonResult
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CommonResult.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CommonResult
     * @function getTypeUrl
     * @memberof CommonResult
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CommonResult.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CommonResult";
    };

    return CommonResult;
})();

export const CommonResultResp = $root.CommonResultResp = (() => {

    /**
     * Properties of a CommonResultResp.
     * @exports ICommonResultResp
     * @interface ICommonResultResp
     * @property {ICommonResult|null} [commonResult] CommonResultResp commonResult
     */

    /**
     * Constructs a new CommonResultResp.
     * @exports CommonResultResp
     * @classdesc Represents a CommonResultResp.
     * @implements ICommonResultResp
     * @constructor
     * @param {ICommonResultResp=} [properties] Properties to set
     */
    function CommonResultResp(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CommonResultResp commonResult.
     * @member {ICommonResult|null|undefined} commonResult
     * @memberof CommonResultResp
     * @instance
     */
    CommonResultResp.prototype.commonResult = null;

    /**
     * Creates a new CommonResultResp instance using the specified properties.
     * @function create
     * @memberof CommonResultResp
     * @static
     * @param {ICommonResultResp=} [properties] Properties to set
     * @returns {CommonResultResp} CommonResultResp instance
     */
    CommonResultResp.create = function create(properties) {
        return new CommonResultResp(properties);
    };

    /**
     * Encodes the specified CommonResultResp message. Does not implicitly {@link CommonResultResp.verify|verify} messages.
     * @function encode
     * @memberof CommonResultResp
     * @static
     * @param {ICommonResultResp} message CommonResultResp message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CommonResultResp.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.commonResult != null && Object.hasOwnProperty.call(message, "commonResult"))
            $root.CommonResult.encode(message.commonResult, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified CommonResultResp message, length delimited. Does not implicitly {@link CommonResultResp.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CommonResultResp
     * @static
     * @param {ICommonResultResp} message CommonResultResp message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CommonResultResp.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CommonResultResp message from the specified reader or buffer.
     * @function decode
     * @memberof CommonResultResp
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CommonResultResp} CommonResultResp
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CommonResultResp.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CommonResultResp();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.commonResult = $root.CommonResult.decode(reader, reader.uint32());
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
     * Decodes a CommonResultResp message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CommonResultResp
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CommonResultResp} CommonResultResp
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CommonResultResp.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CommonResultResp message.
     * @function verify
     * @memberof CommonResultResp
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CommonResultResp.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.commonResult != null && message.hasOwnProperty("commonResult")) {
            let error = $root.CommonResult.verify(message.commonResult);
            if (error)
                return "commonResult." + error;
        }
        return null;
    };

    /**
     * Creates a CommonResultResp message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CommonResultResp
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CommonResultResp} CommonResultResp
     */
    CommonResultResp.fromObject = function fromObject(object) {
        if (object instanceof $root.CommonResultResp)
            return object;
        let message = new $root.CommonResultResp();
        if (object.commonResult != null) {
            if (typeof object.commonResult !== "object")
                throw TypeError(".CommonResultResp.commonResult: object expected");
            message.commonResult = $root.CommonResult.fromObject(object.commonResult);
        }
        return message;
    };

    /**
     * Creates a plain object from a CommonResultResp message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CommonResultResp
     * @static
     * @param {CommonResultResp} message CommonResultResp
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CommonResultResp.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults)
            object.commonResult = null;
        if (message.commonResult != null && message.hasOwnProperty("commonResult"))
            object.commonResult = $root.CommonResult.toObject(message.commonResult, options);
        return object;
    };

    /**
     * Converts this CommonResultResp to JSON.
     * @function toJSON
     * @memberof CommonResultResp
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CommonResultResp.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CommonResultResp
     * @function getTypeUrl
     * @memberof CommonResultResp
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CommonResultResp.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CommonResultResp";
    };

    return CommonResultResp;
})();

export const CommonResultReq = $root.CommonResultReq = (() => {

    /**
     * Properties of a CommonResultReq.
     * @exports ICommonResultReq
     * @interface ICommonResultReq
     * @property {IClientInfo|null} [clientInfo] CommonResultReq clientInfo
     */

    /**
     * Constructs a new CommonResultReq.
     * @exports CommonResultReq
     * @classdesc Represents a CommonResultReq.
     * @implements ICommonResultReq
     * @constructor
     * @param {ICommonResultReq=} [properties] Properties to set
     */
    function CommonResultReq(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CommonResultReq clientInfo.
     * @member {IClientInfo|null|undefined} clientInfo
     * @memberof CommonResultReq
     * @instance
     */
    CommonResultReq.prototype.clientInfo = null;

    /**
     * Creates a new CommonResultReq instance using the specified properties.
     * @function create
     * @memberof CommonResultReq
     * @static
     * @param {ICommonResultReq=} [properties] Properties to set
     * @returns {CommonResultReq} CommonResultReq instance
     */
    CommonResultReq.create = function create(properties) {
        return new CommonResultReq(properties);
    };

    /**
     * Encodes the specified CommonResultReq message. Does not implicitly {@link CommonResultReq.verify|verify} messages.
     * @function encode
     * @memberof CommonResultReq
     * @static
     * @param {ICommonResultReq} message CommonResultReq message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CommonResultReq.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.clientInfo != null && Object.hasOwnProperty.call(message, "clientInfo"))
            $root.ClientInfo.encode(message.clientInfo, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified CommonResultReq message, length delimited. Does not implicitly {@link CommonResultReq.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CommonResultReq
     * @static
     * @param {ICommonResultReq} message CommonResultReq message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CommonResultReq.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CommonResultReq message from the specified reader or buffer.
     * @function decode
     * @memberof CommonResultReq
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CommonResultReq} CommonResultReq
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CommonResultReq.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CommonResultReq();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.clientInfo = $root.ClientInfo.decode(reader, reader.uint32());
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
     * Decodes a CommonResultReq message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CommonResultReq
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CommonResultReq} CommonResultReq
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CommonResultReq.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CommonResultReq message.
     * @function verify
     * @memberof CommonResultReq
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CommonResultReq.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.clientInfo != null && message.hasOwnProperty("clientInfo")) {
            let error = $root.ClientInfo.verify(message.clientInfo);
            if (error)
                return "clientInfo." + error;
        }
        return null;
    };

    /**
     * Creates a CommonResultReq message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CommonResultReq
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CommonResultReq} CommonResultReq
     */
    CommonResultReq.fromObject = function fromObject(object) {
        if (object instanceof $root.CommonResultReq)
            return object;
        let message = new $root.CommonResultReq();
        if (object.clientInfo != null) {
            if (typeof object.clientInfo !== "object")
                throw TypeError(".CommonResultReq.clientInfo: object expected");
            message.clientInfo = $root.ClientInfo.fromObject(object.clientInfo);
        }
        return message;
    };

    /**
     * Creates a plain object from a CommonResultReq message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CommonResultReq
     * @static
     * @param {CommonResultReq} message CommonResultReq
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CommonResultReq.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults)
            object.clientInfo = null;
        if (message.clientInfo != null && message.hasOwnProperty("clientInfo"))
            object.clientInfo = $root.ClientInfo.toObject(message.clientInfo, options);
        return object;
    };

    /**
     * Converts this CommonResultReq to JSON.
     * @function toJSON
     * @memberof CommonResultReq
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CommonResultReq.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CommonResultReq
     * @function getTypeUrl
     * @memberof CommonResultReq
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CommonResultReq.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CommonResultReq";
    };

    return CommonResultReq;
})();

/**
 * AccountType enum.
 * @exports AccountType
 * @enum {number}
 * @property {number} MOBILE=0 MOBILE value
 * @property {number} EMAIL=1 EMAIL value
 */
export const AccountType = $root.AccountType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "MOBILE"] = 0;
    values[valuesById[1] = "EMAIL"] = 1;
    return values;
})();

export const ValidateCode = $root.ValidateCode = (() => {

    /**
     * Properties of a ValidateCode.
     * @exports IValidateCode
     * @interface IValidateCode
     * @property {string|null} [validateValue] ValidateCode validateValue
     * @property {string|null} [validateAccount] ValidateCode validateAccount
     * @property {string|null} [countryCode] ValidateCode countryCode
     * @property {GetValidateCodeType|null} [validateType] ValidateCode validateType
     */

    /**
     * Constructs a new ValidateCode.
     * @exports ValidateCode
     * @classdesc Represents a ValidateCode.
     * @implements IValidateCode
     * @constructor
     * @param {IValidateCode=} [properties] Properties to set
     */
    function ValidateCode(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ValidateCode validateValue.
     * @member {string} validateValue
     * @memberof ValidateCode
     * @instance
     */
    ValidateCode.prototype.validateValue = "";

    /**
     * ValidateCode validateAccount.
     * @member {string} validateAccount
     * @memberof ValidateCode
     * @instance
     */
    ValidateCode.prototype.validateAccount = "";

    /**
     * ValidateCode countryCode.
     * @member {string} countryCode
     * @memberof ValidateCode
     * @instance
     */
    ValidateCode.prototype.countryCode = "";

    /**
     * ValidateCode validateType.
     * @member {GetValidateCodeType} validateType
     * @memberof ValidateCode
     * @instance
     */
    ValidateCode.prototype.validateType = 0;

    /**
     * Creates a new ValidateCode instance using the specified properties.
     * @function create
     * @memberof ValidateCode
     * @static
     * @param {IValidateCode=} [properties] Properties to set
     * @returns {ValidateCode} ValidateCode instance
     */
    ValidateCode.create = function create(properties) {
        return new ValidateCode(properties);
    };

    /**
     * Encodes the specified ValidateCode message. Does not implicitly {@link ValidateCode.verify|verify} messages.
     * @function encode
     * @memberof ValidateCode
     * @static
     * @param {IValidateCode} message ValidateCode message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ValidateCode.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.validateValue != null && Object.hasOwnProperty.call(message, "validateValue"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.validateValue);
        if (message.validateAccount != null && Object.hasOwnProperty.call(message, "validateAccount"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.validateAccount);
        if (message.countryCode != null && Object.hasOwnProperty.call(message, "countryCode"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.countryCode);
        if (message.validateType != null && Object.hasOwnProperty.call(message, "validateType"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.validateType);
        return writer;
    };

    /**
     * Encodes the specified ValidateCode message, length delimited. Does not implicitly {@link ValidateCode.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ValidateCode
     * @static
     * @param {IValidateCode} message ValidateCode message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ValidateCode.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ValidateCode message from the specified reader or buffer.
     * @function decode
     * @memberof ValidateCode
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ValidateCode} ValidateCode
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ValidateCode.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.ValidateCode();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.validateValue = reader.string();
                    break;
                }
            case 2: {
                    message.validateAccount = reader.string();
                    break;
                }
            case 3: {
                    message.countryCode = reader.string();
                    break;
                }
            case 4: {
                    message.validateType = reader.int32();
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
     * Decodes a ValidateCode message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ValidateCode
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ValidateCode} ValidateCode
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ValidateCode.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ValidateCode message.
     * @function verify
     * @memberof ValidateCode
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ValidateCode.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.validateValue != null && message.hasOwnProperty("validateValue"))
            if (!$util.isString(message.validateValue))
                return "validateValue: string expected";
        if (message.validateAccount != null && message.hasOwnProperty("validateAccount"))
            if (!$util.isString(message.validateAccount))
                return "validateAccount: string expected";
        if (message.countryCode != null && message.hasOwnProperty("countryCode"))
            if (!$util.isString(message.countryCode))
                return "countryCode: string expected";
        if (message.validateType != null && message.hasOwnProperty("validateType"))
            switch (message.validateType) {
            default:
                return "validateType: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 6:
            case 7:
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
            case 16:
            case 17:
            case 18:
            case 19:
            case 20:
            case 21:
            case 22:
            case 23:
                break;
            }
        return null;
    };

    /**
     * Creates a ValidateCode message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ValidateCode
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ValidateCode} ValidateCode
     */
    ValidateCode.fromObject = function fromObject(object) {
        if (object instanceof $root.ValidateCode)
            return object;
        let message = new $root.ValidateCode();
        if (object.validateValue != null)
            message.validateValue = String(object.validateValue);
        if (object.validateAccount != null)
            message.validateAccount = String(object.validateAccount);
        if (object.countryCode != null)
            message.countryCode = String(object.countryCode);
        switch (object.validateType) {
        default:
            if (typeof object.validateType === "number") {
                message.validateType = object.validateType;
                break;
            }
            break;
        case "REG":
        case 0:
            message.validateType = 0;
            break;
        case "LOGIN":
        case 1:
            message.validateType = 1;
            break;
        case "FIND_PASSWORD":
        case 2:
            message.validateType = 2;
            break;
        case "UPDATE_PASSWORD":
        case 3:
            message.validateType = 3;
            break;
        case "UPDATE_PHONE":
        case 4:
            message.validateType = 4;
            break;
        case "VALIDATE_PASSWORD":
        case 6:
            message.validateType = 6;
            break;
        case "FIND_GESTURE_PASSWORD":
        case 7:
            message.validateType = 7;
            break;
        case "TRADE_PASSWORD":
        case 8:
            message.validateType = 8;
            break;
        case "UPDATE_TRADE_PASSWORD":
        case 9:
            message.validateType = 9;
            break;
        case "BIND_PHONE":
        case 10:
            message.validateType = 10;
            break;
        case "BIND_EMAIL":
        case 11:
            message.validateType = 11;
            break;
        case "UPDATE_EMAIL":
        case 12:
            message.validateType = 12;
            break;
        case "VALIDATE_GOOGLE_AUTH":
        case 13:
            message.validateType = 13;
            break;
        case "UPDATE_SECURE":
        case 14:
            message.validateType = 14;
            break;
        case "CASH_OUT":
        case 15:
            message.validateType = 15;
            break;
        case "VERIFY_EMAIL":
        case 16:
            message.validateType = 16;
            break;
        case "VERIFY_PHONE":
        case 17:
            message.validateType = 17;
            break;
        case "VERIFY_TRADE_PASSWORD":
        case 18:
            message.validateType = 18;
            break;
        case "VERIFY_GOOGLE_CODE":
        case 19:
            message.validateType = 19;
            break;
        case "BIND_ACCOUNT":
        case 20:
            message.validateType = 20;
            break;
        case "VERIFY_LOGIN_PHONE":
        case 21:
            message.validateType = 21;
            break;
        case "VERIFY_LOGIN_EMAIL":
        case 22:
            message.validateType = 22;
            break;
        case "VERIFY_LOGIN_PASSWORD":
        case 23:
            message.validateType = 23;
            break;
        }
        return message;
    };

    /**
     * Creates a plain object from a ValidateCode message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ValidateCode
     * @static
     * @param {ValidateCode} message ValidateCode
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ValidateCode.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.validateValue = "";
            object.validateAccount = "";
            object.countryCode = "";
            object.validateType = options.enums === String ? "REG" : 0;
        }
        if (message.validateValue != null && message.hasOwnProperty("validateValue"))
            object.validateValue = message.validateValue;
        if (message.validateAccount != null && message.hasOwnProperty("validateAccount"))
            object.validateAccount = message.validateAccount;
        if (message.countryCode != null && message.hasOwnProperty("countryCode"))
            object.countryCode = message.countryCode;
        if (message.validateType != null && message.hasOwnProperty("validateType"))
            object.validateType = options.enums === String ? $root.GetValidateCodeType[message.validateType] === undefined ? message.validateType : $root.GetValidateCodeType[message.validateType] : message.validateType;
        return object;
    };

    /**
     * Converts this ValidateCode to JSON.
     * @function toJSON
     * @memberof ValidateCode
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ValidateCode.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ValidateCode
     * @function getTypeUrl
     * @memberof ValidateCode
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ValidateCode.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/ValidateCode";
    };

    return ValidateCode;
})();

/**
 * GetValidateCodeType enum.
 * @exports GetValidateCodeType
 * @enum {number}
 * @property {number} REG=0 REG value
 * @property {number} LOGIN=1 LOGIN value
 * @property {number} FIND_PASSWORD=2 FIND_PASSWORD value
 * @property {number} UPDATE_PASSWORD=3 UPDATE_PASSWORD value
 * @property {number} UPDATE_PHONE=4 UPDATE_PHONE value
 * @property {number} VALIDATE_PASSWORD=6 VALIDATE_PASSWORD value
 * @property {number} FIND_GESTURE_PASSWORD=7 FIND_GESTURE_PASSWORD value
 * @property {number} TRADE_PASSWORD=8 TRADE_PASSWORD value
 * @property {number} UPDATE_TRADE_PASSWORD=9 UPDATE_TRADE_PASSWORD value
 * @property {number} BIND_PHONE=10 BIND_PHONE value
 * @property {number} BIND_EMAIL=11 BIND_EMAIL value
 * @property {number} UPDATE_EMAIL=12 UPDATE_EMAIL value
 * @property {number} VALIDATE_GOOGLE_AUTH=13 VALIDATE_GOOGLE_AUTH value
 * @property {number} UPDATE_SECURE=14 UPDATE_SECURE value
 * @property {number} CASH_OUT=15 CASH_OUT value
 * @property {number} VERIFY_EMAIL=16 VERIFY_EMAIL value
 * @property {number} VERIFY_PHONE=17 VERIFY_PHONE value
 * @property {number} VERIFY_TRADE_PASSWORD=18 VERIFY_TRADE_PASSWORD value
 * @property {number} VERIFY_GOOGLE_CODE=19 VERIFY_GOOGLE_CODE value
 * @property {number} BIND_ACCOUNT=20 BIND_ACCOUNT value
 * @property {number} VERIFY_LOGIN_PHONE=21 VERIFY_LOGIN_PHONE value
 * @property {number} VERIFY_LOGIN_EMAIL=22 VERIFY_LOGIN_EMAIL value
 * @property {number} VERIFY_LOGIN_PASSWORD=23 VERIFY_LOGIN_PASSWORD value
 */
export const GetValidateCodeType = $root.GetValidateCodeType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "REG"] = 0;
    values[valuesById[1] = "LOGIN"] = 1;
    values[valuesById[2] = "FIND_PASSWORD"] = 2;
    values[valuesById[3] = "UPDATE_PASSWORD"] = 3;
    values[valuesById[4] = "UPDATE_PHONE"] = 4;
    values[valuesById[6] = "VALIDATE_PASSWORD"] = 6;
    values[valuesById[7] = "FIND_GESTURE_PASSWORD"] = 7;
    values[valuesById[8] = "TRADE_PASSWORD"] = 8;
    values[valuesById[9] = "UPDATE_TRADE_PASSWORD"] = 9;
    values[valuesById[10] = "BIND_PHONE"] = 10;
    values[valuesById[11] = "BIND_EMAIL"] = 11;
    values[valuesById[12] = "UPDATE_EMAIL"] = 12;
    values[valuesById[13] = "VALIDATE_GOOGLE_AUTH"] = 13;
    values[valuesById[14] = "UPDATE_SECURE"] = 14;
    values[valuesById[15] = "CASH_OUT"] = 15;
    values[valuesById[16] = "VERIFY_EMAIL"] = 16;
    values[valuesById[17] = "VERIFY_PHONE"] = 17;
    values[valuesById[18] = "VERIFY_TRADE_PASSWORD"] = 18;
    values[valuesById[19] = "VERIFY_GOOGLE_CODE"] = 19;
    values[valuesById[20] = "BIND_ACCOUNT"] = 20;
    values[valuesById[21] = "VERIFY_LOGIN_PHONE"] = 21;
    values[valuesById[22] = "VERIFY_LOGIN_EMAIL"] = 22;
    values[valuesById[23] = "VERIFY_LOGIN_PASSWORD"] = 23;
    return values;
})();

/**
 * LoginMode enum.
 * @exports LoginMode
 * @enum {number}
 * @property {number} HAND=0 HAND value
 * @property {number} SYS_AUTO=1 SYS_AUTO value
 */
export const LoginMode = $root.LoginMode = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "HAND"] = 0;
    values[valuesById[1] = "SYS_AUTO"] = 1;
    return values;
})();

/**
 * LoginType enum.
 * @exports LoginType
 * @enum {number}
 * @property {number} SMS_CODE=0 SMS_CODE value
 * @property {number} PASSWORD=1 PASSWORD value
 * @property {number} AUTH_KEY=2 AUTH_KEY value
 * @property {number} GOOGLE_TOKEN=3 GOOGLE_TOKEN value
 * @property {number} APPLE_TOKEN=4 APPLE_TOKEN value
 */
export const LoginType = $root.LoginType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "SMS_CODE"] = 0;
    values[valuesById[1] = "PASSWORD"] = 1;
    values[valuesById[2] = "AUTH_KEY"] = 2;
    values[valuesById[3] = "GOOGLE_TOKEN"] = 3;
    values[valuesById[4] = "APPLE_TOKEN"] = 4;
    return values;
})();

/**
 * Gender enum.
 * @exports Gender
 * @enum {number}
 * @property {number} SECRECY=0 SECRECY value
 * @property {number} MALE=1 MALE value
 * @property {number} FEMALE=2 FEMALE value
 */
export const Gender = $root.Gender = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "SECRECY"] = 0;
    values[valuesById[1] = "MALE"] = 1;
    values[valuesById[2] = "FEMALE"] = 2;
    return values;
})();

/**
 * Platform enum.
 * @exports Platform
 * @enum {number}
 * @property {number} ANDROID=0 ANDROID value
 * @property {number} IPHONE=1 IPHONE value
 * @property {number} UNKOWN=2 UNKOWN value
 * @property {number} MAC=3 MAC value
 * @property {number} WIN=4 WIN value
 * @property {number} HARMONYOS=5 HARMONYOS value
 */
export const Platform = $root.Platform = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "ANDROID"] = 0;
    values[valuesById[1] = "IPHONE"] = 1;
    values[valuesById[2] = "UNKOWN"] = 2;
    values[valuesById[3] = "MAC"] = 3;
    values[valuesById[4] = "WIN"] = 4;
    values[valuesById[5] = "HARMONYOS"] = 5;
    return values;
})();

/**
 * LastOnlineTimeViewType enum.
 * @exports LastOnlineTimeViewType
 * @enum {number}
 * @property {number} ALL_SHOW=0 ALL_SHOW value
 * @property {number} ONLY_FRIEND=1 ONLY_FRIEND value
 * @property {number} NOT_SHOW=2 NOT_SHOW value
 */
export const LastOnlineTimeViewType = $root.LastOnlineTimeViewType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "ALL_SHOW"] = 0;
    values[valuesById[1] = "ONLY_FRIEND"] = 1;
    values[valuesById[2] = "NOT_SHOW"] = 2;
    return values;
})();

/**
 * SecurityType enum.
 * @exports SecurityType
 * @enum {number}
 * @property {number} OLD_VERSION=0 OLD_VERSION value
 * @property {number} NORMAL_CHECK=1 NORMAL_CHECK value
 * @property {number} SECURITY_CHECK=2 SECURITY_CHECK value
 */
export const SecurityType = $root.SecurityType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "OLD_VERSION"] = 0;
    values[valuesById[1] = "NORMAL_CHECK"] = 1;
    values[valuesById[2] = "SECURITY_CHECK"] = 2;
    return values;
})();

/**
 * GroupMemberType enum.
 * @exports GroupMemberType
 * @enum {number}
 * @property {number} HOST=0 HOST value
 * @property {number} MANAGE=1 MANAGE value
 * @property {number} MEMBER=2 MEMBER value
 */
export const GroupMemberType = $root.GroupMemberType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "HOST"] = 0;
    values[valuesById[1] = "MANAGE"] = 1;
    values[valuesById[2] = "MEMBER"] = 2;
    return values;
})();

/**
 * AttachWorkSpaceType enum.
 * @exports AttachWorkSpaceType
 * @enum {number}
 * @property {number} COMMON=0 COMMON value
 * @property {number} CHAT=1 CHAT value
 */
export const AttachWorkSpaceType = $root.AttachWorkSpaceType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "COMMON"] = 0;
    values[valuesById[1] = "CHAT"] = 1;
    return values;
})();

/**
 * AttachType enum.
 * @exports AttachType
 * @enum {number}
 * @property {number} PIC=0 PIC value
 * @property {number} AUDIO=1 AUDIO value
 * @property {number} VIDEO=2 VIDEO value
 * @property {number} FILE=3 FILE value
 * @property {number} LOG=4 LOG value
 * @property {number} EMOTICON=5 EMOTICON value
 */
export const AttachType = $root.AttachType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "PIC"] = 0;
    values[valuesById[1] = "AUDIO"] = 1;
    values[valuesById[2] = "VIDEO"] = 2;
    values[valuesById[3] = "FILE"] = 3;
    values[valuesById[4] = "LOG"] = 4;
    values[valuesById[5] = "EMOTICON"] = 5;
    return values;
})();

/**
 * QrCodeType enum.
 * @exports QrCodeType
 * @enum {number}
 * @property {number} QR_USER=0 QR_USER value
 * @property {number} QR_GROUP=1 QR_GROUP value
 * @property {number} WEB_LOGIN=2 WEB_LOGIN value
 */
export const QrCodeType = $root.QrCodeType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "QR_USER"] = 0;
    values[valuesById[1] = "QR_GROUP"] = 1;
    values[valuesById[2] = "WEB_LOGIN"] = 2;
    return values;
})();

/**
 * FeedbackType enum.
 * @exports FeedbackType
 * @enum {number}
 * @property {number} SUGGEST=0 SUGGEST value
 * @property {number} MISTAKE=1 MISTAKE value
 * @property {number} OTHER=2 OTHER value
 */
export const FeedbackType = $root.FeedbackType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "SUGGEST"] = 0;
    values[valuesById[1] = "MISTAKE"] = 1;
    values[valuesById[2] = "OTHER"] = 2;
    return values;
})();

/**
 * WebLoginStatus enum.
 * @exports WebLoginStatus
 * @enum {number}
 * @property {number} NOT_SCAN=0 NOT_SCAN value
 * @property {number} SCANNED=1 SCANNED value
 * @property {number} ALREADY_LOGIN=2 ALREADY_LOGIN value
 * @property {number} CANCEL_LOGIN=3 CANCEL_LOGIN value
 */
export const WebLoginStatus = $root.WebLoginStatus = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "NOT_SCAN"] = 0;
    values[valuesById[1] = "SCANNED"] = 1;
    values[valuesById[2] = "ALREADY_LOGIN"] = 2;
    values[valuesById[3] = "CANCEL_LOGIN"] = 3;
    return values;
})();

/**
 * GroupReqStatus enum.
 * @exports GroupReqStatus
 * @enum {number}
 * @property {number} CHECKING=0 CHECKING value
 * @property {number} AGREE=1 AGREE value
 * @property {number} REFUSE=2 REFUSE value
 * @property {number} EXPIRE=3 EXPIRE value
 */
export const GroupReqStatus = $root.GroupReqStatus = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "CHECKING"] = 0;
    values[valuesById[1] = "AGREE"] = 1;
    values[valuesById[2] = "REFUSE"] = 2;
    values[valuesById[3] = "EXPIRE"] = 3;
    return values;
})();

/**
 * GroupReqType enum.
 * @exports GroupReqType
 * @enum {number}
 * @property {number} GROUP_TRANSFER=0 GROUP_TRANSFER value
 * @property {number} GROUP_INVITE=1 GROUP_INVITE value
 * @property {number} GROUP_QR_CODE=2 GROUP_QR_CODE value
 * @property {number} GROUP_OWNER_CHECK_INVITE=3 GROUP_OWNER_CHECK_INVITE value
 * @property {number} GROUP_OWNER_CHECK_QR_CODE=4 GROUP_OWNER_CHECK_QR_CODE value
 * @property {number} GROUP_MEMBER_CHECK=5 GROUP_MEMBER_CHECK value
 * @property {number} GROUP_OWNER_REMOVE_MEMBER=6 GROUP_OWNER_REMOVE_MEMBER value
 * @property {number} GROUP_MEMBER_EXIT=7 GROUP_MEMBER_EXIT value
 * @property {number} GROUP_SET_ADMIN=8 GROUP_SET_ADMIN value
 * @property {number} GROUP_CANCLE_ADMIN=9 GROUP_CANCLE_ADMIN value
 * @property {number} GROUP_ADMIN_UPDATE=10 GROUP_ADMIN_UPDATE value
 * @property {number} GROUP_IS_DISABLED=11 GROUP_IS_DISABLED value
 * @property {number} GROUP_MEMBER_SHUTUP=12 GROUP_MEMBER_SHUTUP value
 * @property {number} GROUP_IS_DISBANDED=13 GROUP_IS_DISBANDED value
 * @property {number} GROUP_LINK=14 GROUP_LINK value
 * @property {number} GROUP_ALIAS=15 GROUP_ALIAS value
 * @property {number} GROUP_IS_ENABLED=16 GROUP_IS_ENABLED value
 * @property {number} GROUP_OBSERVE_ADD=17 GROUP_OBSERVE_ADD value
 * @property {number} GROUP_OBSERVE_REMOVE=18 GROUP_OBSERVE_REMOVE value
 */
export const GroupReqType = $root.GroupReqType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "GROUP_TRANSFER"] = 0;
    values[valuesById[1] = "GROUP_INVITE"] = 1;
    values[valuesById[2] = "GROUP_QR_CODE"] = 2;
    values[valuesById[3] = "GROUP_OWNER_CHECK_INVITE"] = 3;
    values[valuesById[4] = "GROUP_OWNER_CHECK_QR_CODE"] = 4;
    values[valuesById[5] = "GROUP_MEMBER_CHECK"] = 5;
    values[valuesById[6] = "GROUP_OWNER_REMOVE_MEMBER"] = 6;
    values[valuesById[7] = "GROUP_MEMBER_EXIT"] = 7;
    values[valuesById[8] = "GROUP_SET_ADMIN"] = 8;
    values[valuesById[9] = "GROUP_CANCLE_ADMIN"] = 9;
    values[valuesById[10] = "GROUP_ADMIN_UPDATE"] = 10;
    values[valuesById[11] = "GROUP_IS_DISABLED"] = 11;
    values[valuesById[12] = "GROUP_MEMBER_SHUTUP"] = 12;
    values[valuesById[13] = "GROUP_IS_DISBANDED"] = 13;
    values[valuesById[14] = "GROUP_LINK"] = 14;
    values[valuesById[15] = "GROUP_ALIAS"] = 15;
    values[valuesById[16] = "GROUP_IS_ENABLED"] = 16;
    values[valuesById[17] = "GROUP_OBSERVE_ADD"] = 17;
    values[valuesById[18] = "GROUP_OBSERVE_REMOVE"] = 18;
    return values;
})();

/**
 * GroupHandleType enum.
 * @exports GroupHandleType
 * @enum {number}
 * @property {number} GROUP_REQ=0 GROUP_REQ value
 * @property {number} GROUP_NAME=1 GROUP_NAME value
 * @property {number} GROUP_PIC=2 GROUP_PIC value
 * @property {number} GROUP_MEMBER_NICKNAME=3 GROUP_MEMBER_NICKNAME value
 * @property {number} GROUP_NOTICE=4 GROUP_NOTICE value
 * @property {number} GROUP_SHUTUP=5 GROUP_SHUTUP value
 * @property {number} GROUP_READ_CANCEL=6 GROUP_READ_CANCEL value
 */
export const GroupHandleType = $root.GroupHandleType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "GROUP_REQ"] = 0;
    values[valuesById[1] = "GROUP_NAME"] = 1;
    values[valuesById[2] = "GROUP_PIC"] = 2;
    values[valuesById[3] = "GROUP_MEMBER_NICKNAME"] = 3;
    values[valuesById[4] = "GROUP_NOTICE"] = 4;
    values[valuesById[5] = "GROUP_SHUTUP"] = 5;
    values[valuesById[6] = "GROUP_READ_CANCEL"] = 6;
    return values;
})();

/**
 * MsgReceiptStatus enum.
 * @exports MsgReceiptStatus
 * @enum {number}
 * @property {number} DELIVERED=0 DELIVERED value
 * @property {number} VIEWED=1 VIEWED value
 * @property {number} PLAYED=2 PLAYED value
 * @property {number} PROCESSED=3 PROCESSED value
 */
export const MsgReceiptStatus = $root.MsgReceiptStatus = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "DELIVERED"] = 0;
    values[valuesById[1] = "VIEWED"] = 1;
    values[valuesById[2] = "PLAYED"] = 2;
    values[valuesById[3] = "PROCESSED"] = 3;
    return values;
})();

/**
 * CheckVersionFlag enum.
 * @exports CheckVersionFlag
 * @enum {number}
 * @property {number} NOT_UP=0 NOT_UP value
 * @property {number} CAN_UP=1 CAN_UP value
 * @property {number} MUST_UP=2 MUST_UP value
 */
export const CheckVersionFlag = $root.CheckVersionFlag = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "NOT_UP"] = 0;
    values[valuesById[1] = "CAN_UP"] = 1;
    values[valuesById[2] = "MUST_UP"] = 2;
    return values;
})();

/**
 * KeyPairType enum.
 * @exports KeyPairType
 * @enum {number}
 * @property {number} KEY_USER=0 KEY_USER value
 * @property {number} KEY_GROUP=1 KEY_GROUP value
 * @property {number} KEY_USER_WEB=2 KEY_USER_WEB value
 * @property {number} KEY_CHANNEL=3 KEY_CHANNEL value
 */
export const KeyPairType = $root.KeyPairType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "KEY_USER"] = 0;
    values[valuesById[1] = "KEY_GROUP"] = 1;
    values[valuesById[2] = "KEY_USER_WEB"] = 2;
    values[valuesById[3] = "KEY_CHANNEL"] = 3;
    return values;
})();

/**
 * AdminRightType enum.
 * @exports AdminRightType
 * @enum {number}
 * @property {number} ALL_RIGHT=0 ALL_RIGHT value
 * @property {number} UPDATE_DATA=1 UPDATE_DATA value
 * @property {number} CHECK_APPLY=2 CHECK_APPLY value
 * @property {number} PUSH_NOTICE=3 PUSH_NOTICE value
 * @property {number} SET_ADMIN=4 SET_ADMIN value
 * @property {number} SET_JOIN_NOTICE=5 SET_JOIN_NOTICE value
 */
export const AdminRightType = $root.AdminRightType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "ALL_RIGHT"] = 0;
    values[valuesById[1] = "UPDATE_DATA"] = 1;
    values[valuesById[2] = "CHECK_APPLY"] = 2;
    values[valuesById[3] = "PUSH_NOTICE"] = 3;
    values[valuesById[4] = "SET_ADMIN"] = 4;
    values[valuesById[5] = "SET_JOIN_NOTICE"] = 5;
    return values;
})();

/**
 * SearchMapType enum.
 * @exports SearchMapType
 * @enum {number}
 * @property {number} GAODE=0 GAODE value
 * @property {number} GOOGLE=1 GOOGLE value
 * @property {number} BAIDU=2 BAIDU value
 */
export const SearchMapType = $root.SearchMapType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "GAODE"] = 0;
    values[valuesById[1] = "GOOGLE"] = 1;
    values[valuesById[2] = "BAIDU"] = 2;
    return values;
})();

/**
 * ClearTimeType enum.
 * @exports ClearTimeType
 * @enum {number}
 * @property {number} SIX_MONTH=0 SIX_MONTH value
 * @property {number} ONE_MONTH=1 ONE_MONTH value
 * @property {number} THIRD_MONTH=2 THIRD_MONTH value
 * @property {number} TWELVE_MONTH=3 TWELVE_MONTH value
 */
export const ClearTimeType = $root.ClearTimeType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "SIX_MONTH"] = 0;
    values[valuesById[1] = "ONE_MONTH"] = 1;
    values[valuesById[2] = "THIRD_MONTH"] = 2;
    values[valuesById[3] = "TWELVE_MONTH"] = 3;
    return values;
})();

/**
 * InviteLinkType enum.
 * @exports InviteLinkType
 * @enum {number}
 * @property {number} LINK_USER=0 LINK_USER value
 * @property {number} LINK_GROUP=1 LINK_GROUP value
 */
export const InviteLinkType = $root.InviteLinkType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "LINK_USER"] = 0;
    values[valuesById[1] = "LINK_GROUP"] = 1;
    return values;
})();

/**
 * EditType enum.
 * @exports EditType
 * @enum {number}
 * @property {number} UNMODIFIED=0 UNMODIFIED value
 * @property {number} MODIFIED=1 MODIFIED value
 */
export const EditType = $root.EditType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "UNMODIFIED"] = 0;
    values[valuesById[1] = "MODIFIED"] = 1;
    return values;
})();

/**
 * FilterType enum.
 * @exports FilterType
 * @enum {number}
 * @property {number} BE_DEFAULT=0 BE_DEFAULT value
 * @property {number} BE_MEMBER=1 BE_MEMBER value
 * @property {number} BE_ADMIN=2 BE_ADMIN value
 * @property {number} NOT_ONESELF=3 NOT_ONESELF value
 * @property {number} NOT_HOST=4 NOT_HOST value
 * @property {number} NOT_ADMIN=5 NOT_ADMIN value
 */
export const FilterType = $root.FilterType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "BE_DEFAULT"] = 0;
    values[valuesById[1] = "BE_MEMBER"] = 1;
    values[valuesById[2] = "BE_ADMIN"] = 2;
    values[valuesById[3] = "NOT_ONESELF"] = 3;
    values[valuesById[4] = "NOT_HOST"] = 4;
    values[valuesById[5] = "NOT_ADMIN"] = 5;
    return values;
})();

/**
 * SafeSwitchType enum.
 * @exports SafeSwitchType
 * @enum {number}
 * @property {number} EMAIL_TYPE=0 EMAIL_TYPE value
 * @property {number} PHONE_TYPE=1 PHONE_TYPE value
 * @property {number} GOOGLE_AUTH_TYPE=2 GOOGLE_AUTH_TYPE value
 * @property {number} TRADE_PASSWORD_TYPE=3 TRADE_PASSWORD_TYPE value
 */
export const SafeSwitchType = $root.SafeSwitchType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "EMAIL_TYPE"] = 0;
    values[valuesById[1] = "PHONE_TYPE"] = 1;
    values[valuesById[2] = "GOOGLE_AUTH_TYPE"] = 2;
    values[valuesById[3] = "TRADE_PASSWORD_TYPE"] = 3;
    return values;
})();

/**
 * operateType enum.
 * @exports operateType
 * @enum {number}
 * @property {number} UPDATE=0 UPDATE value
 * @property {number} DELETE=1 DELETE value
 */
export const operateType = $root.operateType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "UPDATE"] = 0;
    values[valuesById[1] = "DELETE"] = 1;
    return values;
})();

/**
 * CheckTradePassword enum.
 * @exports CheckTradePassword
 * @enum {number}
 * @property {number} OLD_ERROR=0 OLD_ERROR value
 * @property {number} NEW_THE_SAME=1 NEW_THE_SAME value
 * @property {number} PASS=2 PASS value
 * @property {number} OVER_TIME=3 OVER_TIME value
 */
export const CheckTradePassword = $root.CheckTradePassword = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "OLD_ERROR"] = 0;
    values[valuesById[1] = "NEW_THE_SAME"] = 1;
    values[valuesById[2] = "PASS"] = 2;
    values[valuesById[3] = "OVER_TIME"] = 3;
    return values;
})();

export const GroupAssistantMessageContent = $root.GroupAssistantMessageContent = (() => {

    /**
     * Properties of a GroupAssistantMessageContent.
     * @exports IGroupAssistantMessageContent
     * @interface IGroupAssistantMessageContent
     * @property {Uint8Array|null} [content] GroupAssistantMessageContent content
     * @property {string|null} [attachmentKey] GroupAssistantMessageContent attachmentKey
     */

    /**
     * Constructs a new GroupAssistantMessageContent.
     * @exports GroupAssistantMessageContent
     * @classdesc Represents a GroupAssistantMessageContent.
     * @implements IGroupAssistantMessageContent
     * @constructor
     * @param {IGroupAssistantMessageContent=} [properties] Properties to set
     */
    function GroupAssistantMessageContent(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupAssistantMessageContent content.
     * @member {Uint8Array} content
     * @memberof GroupAssistantMessageContent
     * @instance
     */
    GroupAssistantMessageContent.prototype.content = $util.newBuffer([]);

    /**
     * GroupAssistantMessageContent attachmentKey.
     * @member {string} attachmentKey
     * @memberof GroupAssistantMessageContent
     * @instance
     */
    GroupAssistantMessageContent.prototype.attachmentKey = "";

    /**
     * Creates a new GroupAssistantMessageContent instance using the specified properties.
     * @function create
     * @memberof GroupAssistantMessageContent
     * @static
     * @param {IGroupAssistantMessageContent=} [properties] Properties to set
     * @returns {GroupAssistantMessageContent} GroupAssistantMessageContent instance
     */
    GroupAssistantMessageContent.create = function create(properties) {
        return new GroupAssistantMessageContent(properties);
    };

    /**
     * Encodes the specified GroupAssistantMessageContent message. Does not implicitly {@link GroupAssistantMessageContent.verify|verify} messages.
     * @function encode
     * @memberof GroupAssistantMessageContent
     * @static
     * @param {IGroupAssistantMessageContent} message GroupAssistantMessageContent message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupAssistantMessageContent.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.content != null && Object.hasOwnProperty.call(message, "content"))
            writer.uint32(/* id 1, wireType 2 =*/10).bytes(message.content);
        if (message.attachmentKey != null && Object.hasOwnProperty.call(message, "attachmentKey"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.attachmentKey);
        return writer;
    };

    /**
     * Encodes the specified GroupAssistantMessageContent message, length delimited. Does not implicitly {@link GroupAssistantMessageContent.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupAssistantMessageContent
     * @static
     * @param {IGroupAssistantMessageContent} message GroupAssistantMessageContent message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupAssistantMessageContent.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupAssistantMessageContent message from the specified reader or buffer.
     * @function decode
     * @memberof GroupAssistantMessageContent
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupAssistantMessageContent} GroupAssistantMessageContent
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupAssistantMessageContent.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupAssistantMessageContent();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.content = reader.bytes();
                    break;
                }
            case 2: {
                    message.attachmentKey = reader.string();
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
     * Decodes a GroupAssistantMessageContent message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupAssistantMessageContent
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupAssistantMessageContent} GroupAssistantMessageContent
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupAssistantMessageContent.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupAssistantMessageContent message.
     * @function verify
     * @memberof GroupAssistantMessageContent
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupAssistantMessageContent.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.content != null && message.hasOwnProperty("content"))
            if (!(message.content && typeof message.content.length === "number" || $util.isString(message.content)))
                return "content: buffer expected";
        if (message.attachmentKey != null && message.hasOwnProperty("attachmentKey"))
            if (!$util.isString(message.attachmentKey))
                return "attachmentKey: string expected";
        return null;
    };

    /**
     * Creates a GroupAssistantMessageContent message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupAssistantMessageContent
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupAssistantMessageContent} GroupAssistantMessageContent
     */
    GroupAssistantMessageContent.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupAssistantMessageContent)
            return object;
        let message = new $root.GroupAssistantMessageContent();
        if (object.content != null)
            if (typeof object.content === "string")
                $util.base64.decode(object.content, message.content = $util.newBuffer($util.base64.length(object.content)), 0);
            else if (object.content.length >= 0)
                message.content = object.content;
        if (object.attachmentKey != null)
            message.attachmentKey = String(object.attachmentKey);
        return message;
    };

    /**
     * Creates a plain object from a GroupAssistantMessageContent message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupAssistantMessageContent
     * @static
     * @param {GroupAssistantMessageContent} message GroupAssistantMessageContent
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupAssistantMessageContent.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if (options.bytes === String)
                object.content = "";
            else {
                object.content = [];
                if (options.bytes !== Array)
                    object.content = $util.newBuffer(object.content);
            }
            object.attachmentKey = "";
        }
        if (message.content != null && message.hasOwnProperty("content"))
            object.content = options.bytes === String ? $util.base64.encode(message.content, 0, message.content.length) : options.bytes === Array ? Array.prototype.slice.call(message.content) : message.content;
        if (message.attachmentKey != null && message.hasOwnProperty("attachmentKey"))
            object.attachmentKey = message.attachmentKey;
        return object;
    };

    /**
     * Converts this GroupAssistantMessageContent to JSON.
     * @function toJSON
     * @memberof GroupAssistantMessageContent
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupAssistantMessageContent.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupAssistantMessageContent
     * @function getTypeUrl
     * @memberof GroupAssistantMessageContent
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupAssistantMessageContent.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupAssistantMessageContent";
    };

    return GroupAssistantMessageContent;
})();

export const UserBase = $root.UserBase = (() => {

    /**
     * Properties of a UserBase.
     * @exports IUserBase
     * @interface IUserBase
     * @property {number|Long|null} [uid] UserBase uid
     * @property {string|null} [nickName] UserBase nickName
     * @property {string|null} [icon] UserBase icon
     * @property {Gender|null} [gender] UserBase gender
     * @property {IFriendRelation|null} [friendRelation] UserBase friendRelation
     * @property {IUserOnOrOffLine|null} [userOnOrOffline] UserBase userOnOrOffline
     * @property {string|null} [signature] UserBase signature
     * @property {string|null} [depict] UserBase depict
     * @property {boolean|null} [bfCancel] UserBase bfCancel
     * @property {boolean|null} [bfBanned] UserBase bfBanned
     * @property {string|null} [identify] UserBase identify
     * @property {string|null} [realName] UserBase realName
     * @property {string|null} [idNumber] UserBase idNumber
     * @property {number|Long|null} [createTime] UserBase createTime
     * @property {number|null} [userType] UserBase userType
     */

    /**
     * Constructs a new UserBase.
     * @exports UserBase
     * @classdesc Represents a UserBase.
     * @implements IUserBase
     * @constructor
     * @param {IUserBase=} [properties] Properties to set
     */
    function UserBase(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * UserBase uid.
     * @member {number|Long} uid
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.uid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * UserBase nickName.
     * @member {string} nickName
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.nickName = "";

    /**
     * UserBase icon.
     * @member {string} icon
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.icon = "";

    /**
     * UserBase gender.
     * @member {Gender} gender
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.gender = 0;

    /**
     * UserBase friendRelation.
     * @member {IFriendRelation|null|undefined} friendRelation
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.friendRelation = null;

    /**
     * UserBase userOnOrOffline.
     * @member {IUserOnOrOffLine|null|undefined} userOnOrOffline
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.userOnOrOffline = null;

    /**
     * UserBase signature.
     * @member {string} signature
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.signature = "";

    /**
     * UserBase depict.
     * @member {string} depict
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.depict = "";

    /**
     * UserBase bfCancel.
     * @member {boolean} bfCancel
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.bfCancel = false;

    /**
     * UserBase bfBanned.
     * @member {boolean} bfBanned
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.bfBanned = false;

    /**
     * UserBase identify.
     * @member {string} identify
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.identify = "";

    /**
     * UserBase realName.
     * @member {string} realName
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.realName = "";

    /**
     * UserBase idNumber.
     * @member {string} idNumber
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.idNumber = "";

    /**
     * UserBase createTime.
     * @member {number|Long} createTime
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.createTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * UserBase userType.
     * @member {number} userType
     * @memberof UserBase
     * @instance
     */
    UserBase.prototype.userType = 0;

    /**
     * Creates a new UserBase instance using the specified properties.
     * @function create
     * @memberof UserBase
     * @static
     * @param {IUserBase=} [properties] Properties to set
     * @returns {UserBase} UserBase instance
     */
    UserBase.create = function create(properties) {
        return new UserBase(properties);
    };

    /**
     * Encodes the specified UserBase message. Does not implicitly {@link UserBase.verify|verify} messages.
     * @function encode
     * @memberof UserBase
     * @static
     * @param {IUserBase} message UserBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UserBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.uid);
        if (message.nickName != null && Object.hasOwnProperty.call(message, "nickName"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.nickName);
        if (message.icon != null && Object.hasOwnProperty.call(message, "icon"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.icon);
        if (message.gender != null && Object.hasOwnProperty.call(message, "gender"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.gender);
        if (message.friendRelation != null && Object.hasOwnProperty.call(message, "friendRelation"))
            $root.FriendRelation.encode(message.friendRelation, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
        if (message.userOnOrOffline != null && Object.hasOwnProperty.call(message, "userOnOrOffline"))
            $root.UserOnOrOffLine.encode(message.userOnOrOffline, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
        if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
            writer.uint32(/* id 7, wireType 2 =*/58).string(message.signature);
        if (message.depict != null && Object.hasOwnProperty.call(message, "depict"))
            writer.uint32(/* id 8, wireType 2 =*/66).string(message.depict);
        if (message.bfCancel != null && Object.hasOwnProperty.call(message, "bfCancel"))
            writer.uint32(/* id 9, wireType 0 =*/72).bool(message.bfCancel);
        if (message.bfBanned != null && Object.hasOwnProperty.call(message, "bfBanned"))
            writer.uint32(/* id 10, wireType 0 =*/80).bool(message.bfBanned);
        if (message.identify != null && Object.hasOwnProperty.call(message, "identify"))
            writer.uint32(/* id 11, wireType 2 =*/90).string(message.identify);
        if (message.realName != null && Object.hasOwnProperty.call(message, "realName"))
            writer.uint32(/* id 12, wireType 2 =*/98).string(message.realName);
        if (message.idNumber != null && Object.hasOwnProperty.call(message, "idNumber"))
            writer.uint32(/* id 13, wireType 2 =*/106).string(message.idNumber);
        if (message.createTime != null && Object.hasOwnProperty.call(message, "createTime"))
            writer.uint32(/* id 14, wireType 0 =*/112).int64(message.createTime);
        if (message.userType != null && Object.hasOwnProperty.call(message, "userType"))
            writer.uint32(/* id 15, wireType 0 =*/120).int32(message.userType);
        return writer;
    };

    /**
     * Encodes the specified UserBase message, length delimited. Does not implicitly {@link UserBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof UserBase
     * @static
     * @param {IUserBase} message UserBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UserBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a UserBase message from the specified reader or buffer.
     * @function decode
     * @memberof UserBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {UserBase} UserBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UserBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.UserBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.uid = reader.int64();
                    break;
                }
            case 2: {
                    message.nickName = reader.string();
                    break;
                }
            case 3: {
                    message.icon = reader.string();
                    break;
                }
            case 4: {
                    message.gender = reader.int32();
                    break;
                }
            case 5: {
                    message.friendRelation = $root.FriendRelation.decode(reader, reader.uint32());
                    break;
                }
            case 6: {
                    message.userOnOrOffline = $root.UserOnOrOffLine.decode(reader, reader.uint32());
                    break;
                }
            case 7: {
                    message.signature = reader.string();
                    break;
                }
            case 8: {
                    message.depict = reader.string();
                    break;
                }
            case 9: {
                    message.bfCancel = reader.bool();
                    break;
                }
            case 10: {
                    message.bfBanned = reader.bool();
                    break;
                }
            case 11: {
                    message.identify = reader.string();
                    break;
                }
            case 12: {
                    message.realName = reader.string();
                    break;
                }
            case 13: {
                    message.idNumber = reader.string();
                    break;
                }
            case 14: {
                    message.createTime = reader.int64();
                    break;
                }
            case 15: {
                    message.userType = reader.int32();
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
     * Decodes a UserBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof UserBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {UserBase} UserBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UserBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a UserBase message.
     * @function verify
     * @memberof UserBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    UserBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.uid != null && message.hasOwnProperty("uid"))
            if (!$util.isInteger(message.uid) && !(message.uid && $util.isInteger(message.uid.low) && $util.isInteger(message.uid.high)))
                return "uid: integer|Long expected";
        if (message.nickName != null && message.hasOwnProperty("nickName"))
            if (!$util.isString(message.nickName))
                return "nickName: string expected";
        if (message.icon != null && message.hasOwnProperty("icon"))
            if (!$util.isString(message.icon))
                return "icon: string expected";
        if (message.gender != null && message.hasOwnProperty("gender"))
            switch (message.gender) {
            default:
                return "gender: enum value expected";
            case 0:
            case 1:
            case 2:
                break;
            }
        if (message.friendRelation != null && message.hasOwnProperty("friendRelation")) {
            let error = $root.FriendRelation.verify(message.friendRelation);
            if (error)
                return "friendRelation." + error;
        }
        if (message.userOnOrOffline != null && message.hasOwnProperty("userOnOrOffline")) {
            let error = $root.UserOnOrOffLine.verify(message.userOnOrOffline);
            if (error)
                return "userOnOrOffline." + error;
        }
        if (message.signature != null && message.hasOwnProperty("signature"))
            if (!$util.isString(message.signature))
                return "signature: string expected";
        if (message.depict != null && message.hasOwnProperty("depict"))
            if (!$util.isString(message.depict))
                return "depict: string expected";
        if (message.bfCancel != null && message.hasOwnProperty("bfCancel"))
            if (typeof message.bfCancel !== "boolean")
                return "bfCancel: boolean expected";
        if (message.bfBanned != null && message.hasOwnProperty("bfBanned"))
            if (typeof message.bfBanned !== "boolean")
                return "bfBanned: boolean expected";
        if (message.identify != null && message.hasOwnProperty("identify"))
            if (!$util.isString(message.identify))
                return "identify: string expected";
        if (message.realName != null && message.hasOwnProperty("realName"))
            if (!$util.isString(message.realName))
                return "realName: string expected";
        if (message.idNumber != null && message.hasOwnProperty("idNumber"))
            if (!$util.isString(message.idNumber))
                return "idNumber: string expected";
        if (message.createTime != null && message.hasOwnProperty("createTime"))
            if (!$util.isInteger(message.createTime) && !(message.createTime && $util.isInteger(message.createTime.low) && $util.isInteger(message.createTime.high)))
                return "createTime: integer|Long expected";
        if (message.userType != null && message.hasOwnProperty("userType"))
            if (!$util.isInteger(message.userType))
                return "userType: integer expected";
        return null;
    };

    /**
     * Creates a UserBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof UserBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {UserBase} UserBase
     */
    UserBase.fromObject = function fromObject(object) {
        if (object instanceof $root.UserBase)
            return object;
        let message = new $root.UserBase();
        if (object.uid != null)
            if ($util.Long)
                (message.uid = $util.Long.fromValue(object.uid)).unsigned = false;
            else if (typeof object.uid === "string")
                message.uid = parseInt(object.uid, 10);
            else if (typeof object.uid === "number")
                message.uid = object.uid;
            else if (typeof object.uid === "object")
                message.uid = new $util.LongBits(object.uid.low >>> 0, object.uid.high >>> 0).toNumber();
        if (object.nickName != null)
            message.nickName = String(object.nickName);
        if (object.icon != null)
            message.icon = String(object.icon);
        switch (object.gender) {
        default:
            if (typeof object.gender === "number") {
                message.gender = object.gender;
                break;
            }
            break;
        case "SECRECY":
        case 0:
            message.gender = 0;
            break;
        case "MALE":
        case 1:
            message.gender = 1;
            break;
        case "FEMALE":
        case 2:
            message.gender = 2;
            break;
        }
        if (object.friendRelation != null) {
            if (typeof object.friendRelation !== "object")
                throw TypeError(".UserBase.friendRelation: object expected");
            message.friendRelation = $root.FriendRelation.fromObject(object.friendRelation);
        }
        if (object.userOnOrOffline != null) {
            if (typeof object.userOnOrOffline !== "object")
                throw TypeError(".UserBase.userOnOrOffline: object expected");
            message.userOnOrOffline = $root.UserOnOrOffLine.fromObject(object.userOnOrOffline);
        }
        if (object.signature != null)
            message.signature = String(object.signature);
        if (object.depict != null)
            message.depict = String(object.depict);
        if (object.bfCancel != null)
            message.bfCancel = Boolean(object.bfCancel);
        if (object.bfBanned != null)
            message.bfBanned = Boolean(object.bfBanned);
        if (object.identify != null)
            message.identify = String(object.identify);
        if (object.realName != null)
            message.realName = String(object.realName);
        if (object.idNumber != null)
            message.idNumber = String(object.idNumber);
        if (object.createTime != null)
            if ($util.Long)
                (message.createTime = $util.Long.fromValue(object.createTime)).unsigned = false;
            else if (typeof object.createTime === "string")
                message.createTime = parseInt(object.createTime, 10);
            else if (typeof object.createTime === "number")
                message.createTime = object.createTime;
            else if (typeof object.createTime === "object")
                message.createTime = new $util.LongBits(object.createTime.low >>> 0, object.createTime.high >>> 0).toNumber();
        if (object.userType != null)
            message.userType = object.userType | 0;
        return message;
    };

    /**
     * Creates a plain object from a UserBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof UserBase
     * @static
     * @param {UserBase} message UserBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    UserBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.uid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.uid = options.longs === String ? "0" : 0;
            object.nickName = "";
            object.icon = "";
            object.gender = options.enums === String ? "SECRECY" : 0;
            object.friendRelation = null;
            object.userOnOrOffline = null;
            object.signature = "";
            object.depict = "";
            object.bfCancel = false;
            object.bfBanned = false;
            object.identify = "";
            object.realName = "";
            object.idNumber = "";
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.createTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.createTime = options.longs === String ? "0" : 0;
            object.userType = 0;
        }
        if (message.uid != null && message.hasOwnProperty("uid"))
            if (typeof message.uid === "number")
                object.uid = options.longs === String ? String(message.uid) : message.uid;
            else
                object.uid = options.longs === String ? $util.Long.prototype.toString.call(message.uid) : options.longs === Number ? new $util.LongBits(message.uid.low >>> 0, message.uid.high >>> 0).toNumber() : message.uid;
        if (message.nickName != null && message.hasOwnProperty("nickName"))
            object.nickName = message.nickName;
        if (message.icon != null && message.hasOwnProperty("icon"))
            object.icon = message.icon;
        if (message.gender != null && message.hasOwnProperty("gender"))
            object.gender = options.enums === String ? $root.Gender[message.gender] === undefined ? message.gender : $root.Gender[message.gender] : message.gender;
        if (message.friendRelation != null && message.hasOwnProperty("friendRelation"))
            object.friendRelation = $root.FriendRelation.toObject(message.friendRelation, options);
        if (message.userOnOrOffline != null && message.hasOwnProperty("userOnOrOffline"))
            object.userOnOrOffline = $root.UserOnOrOffLine.toObject(message.userOnOrOffline, options);
        if (message.signature != null && message.hasOwnProperty("signature"))
            object.signature = message.signature;
        if (message.depict != null && message.hasOwnProperty("depict"))
            object.depict = message.depict;
        if (message.bfCancel != null && message.hasOwnProperty("bfCancel"))
            object.bfCancel = message.bfCancel;
        if (message.bfBanned != null && message.hasOwnProperty("bfBanned"))
            object.bfBanned = message.bfBanned;
        if (message.identify != null && message.hasOwnProperty("identify"))
            object.identify = message.identify;
        if (message.realName != null && message.hasOwnProperty("realName"))
            object.realName = message.realName;
        if (message.idNumber != null && message.hasOwnProperty("idNumber"))
            object.idNumber = message.idNumber;
        if (message.createTime != null && message.hasOwnProperty("createTime"))
            if (typeof message.createTime === "number")
                object.createTime = options.longs === String ? String(message.createTime) : message.createTime;
            else
                object.createTime = options.longs === String ? $util.Long.prototype.toString.call(message.createTime) : options.longs === Number ? new $util.LongBits(message.createTime.low >>> 0, message.createTime.high >>> 0).toNumber() : message.createTime;
        if (message.userType != null && message.hasOwnProperty("userType"))
            object.userType = message.userType;
        return object;
    };

    /**
     * Converts this UserBase to JSON.
     * @function toJSON
     * @memberof UserBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    UserBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for UserBase
     * @function getTypeUrl
     * @memberof UserBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    UserBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/UserBase";
    };

    return UserBase;
})();

export const UserSwitch = $root.UserSwitch = (() => {

    /**
     * Properties of a UserSwitch.
     * @exports IUserSwitch
     * @interface IUserSwitch
     * @property {boolean|null} [phoneValidate] UserSwitch phoneValidate
     * @property {boolean|null} [emailValidate] UserSwitch emailValidate
     */

    /**
     * Constructs a new UserSwitch.
     * @exports UserSwitch
     * @classdesc Represents a UserSwitch.
     * @implements IUserSwitch
     * @constructor
     * @param {IUserSwitch=} [properties] Properties to set
     */
    function UserSwitch(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * UserSwitch phoneValidate.
     * @member {boolean} phoneValidate
     * @memberof UserSwitch
     * @instance
     */
    UserSwitch.prototype.phoneValidate = false;

    /**
     * UserSwitch emailValidate.
     * @member {boolean} emailValidate
     * @memberof UserSwitch
     * @instance
     */
    UserSwitch.prototype.emailValidate = false;

    /**
     * Creates a new UserSwitch instance using the specified properties.
     * @function create
     * @memberof UserSwitch
     * @static
     * @param {IUserSwitch=} [properties] Properties to set
     * @returns {UserSwitch} UserSwitch instance
     */
    UserSwitch.create = function create(properties) {
        return new UserSwitch(properties);
    };

    /**
     * Encodes the specified UserSwitch message. Does not implicitly {@link UserSwitch.verify|verify} messages.
     * @function encode
     * @memberof UserSwitch
     * @static
     * @param {IUserSwitch} message UserSwitch message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UserSwitch.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.phoneValidate != null && Object.hasOwnProperty.call(message, "phoneValidate"))
            writer.uint32(/* id 1, wireType 0 =*/8).bool(message.phoneValidate);
        if (message.emailValidate != null && Object.hasOwnProperty.call(message, "emailValidate"))
            writer.uint32(/* id 2, wireType 0 =*/16).bool(message.emailValidate);
        return writer;
    };

    /**
     * Encodes the specified UserSwitch message, length delimited. Does not implicitly {@link UserSwitch.verify|verify} messages.
     * @function encodeDelimited
     * @memberof UserSwitch
     * @static
     * @param {IUserSwitch} message UserSwitch message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UserSwitch.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a UserSwitch message from the specified reader or buffer.
     * @function decode
     * @memberof UserSwitch
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {UserSwitch} UserSwitch
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UserSwitch.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.UserSwitch();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.phoneValidate = reader.bool();
                    break;
                }
            case 2: {
                    message.emailValidate = reader.bool();
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
     * Decodes a UserSwitch message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof UserSwitch
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {UserSwitch} UserSwitch
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UserSwitch.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a UserSwitch message.
     * @function verify
     * @memberof UserSwitch
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    UserSwitch.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.phoneValidate != null && message.hasOwnProperty("phoneValidate"))
            if (typeof message.phoneValidate !== "boolean")
                return "phoneValidate: boolean expected";
        if (message.emailValidate != null && message.hasOwnProperty("emailValidate"))
            if (typeof message.emailValidate !== "boolean")
                return "emailValidate: boolean expected";
        return null;
    };

    /**
     * Creates a UserSwitch message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof UserSwitch
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {UserSwitch} UserSwitch
     */
    UserSwitch.fromObject = function fromObject(object) {
        if (object instanceof $root.UserSwitch)
            return object;
        let message = new $root.UserSwitch();
        if (object.phoneValidate != null)
            message.phoneValidate = Boolean(object.phoneValidate);
        if (object.emailValidate != null)
            message.emailValidate = Boolean(object.emailValidate);
        return message;
    };

    /**
     * Creates a plain object from a UserSwitch message. Also converts values to other types if specified.
     * @function toObject
     * @memberof UserSwitch
     * @static
     * @param {UserSwitch} message UserSwitch
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    UserSwitch.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.phoneValidate = false;
            object.emailValidate = false;
        }
        if (message.phoneValidate != null && message.hasOwnProperty("phoneValidate"))
            object.phoneValidate = message.phoneValidate;
        if (message.emailValidate != null && message.hasOwnProperty("emailValidate"))
            object.emailValidate = message.emailValidate;
        return object;
    };

    /**
     * Converts this UserSwitch to JSON.
     * @function toJSON
     * @memberof UserSwitch
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    UserSwitch.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for UserSwitch
     * @function getTypeUrl
     * @memberof UserSwitch
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    UserSwitch.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/UserSwitch";
    };

    return UserSwitch;
})();

export const FriendRelation = $root.FriendRelation = (() => {

    /**
     * Properties of a FriendRelation.
     * @exports IFriendRelation
     * @interface IFriendRelation
     * @property {boolean|null} [bfFriend] FriendRelation bfFriend
     * @property {string|null} [remarkName] FriendRelation remarkName
     * @property {number|null} [status] FriendRelation status
     */

    /**
     * Constructs a new FriendRelation.
     * @exports FriendRelation
     * @classdesc Represents a FriendRelation.
     * @implements IFriendRelation
     * @constructor
     * @param {IFriendRelation=} [properties] Properties to set
     */
    function FriendRelation(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * FriendRelation bfFriend.
     * @member {boolean} bfFriend
     * @memberof FriendRelation
     * @instance
     */
    FriendRelation.prototype.bfFriend = false;

    /**
     * FriendRelation remarkName.
     * @member {string} remarkName
     * @memberof FriendRelation
     * @instance
     */
    FriendRelation.prototype.remarkName = "";

    /**
     * FriendRelation status.
     * @member {number} status
     * @memberof FriendRelation
     * @instance
     */
    FriendRelation.prototype.status = 0;

    /**
     * Creates a new FriendRelation instance using the specified properties.
     * @function create
     * @memberof FriendRelation
     * @static
     * @param {IFriendRelation=} [properties] Properties to set
     * @returns {FriendRelation} FriendRelation instance
     */
    FriendRelation.create = function create(properties) {
        return new FriendRelation(properties);
    };

    /**
     * Encodes the specified FriendRelation message. Does not implicitly {@link FriendRelation.verify|verify} messages.
     * @function encode
     * @memberof FriendRelation
     * @static
     * @param {IFriendRelation} message FriendRelation message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    FriendRelation.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.bfFriend != null && Object.hasOwnProperty.call(message, "bfFriend"))
            writer.uint32(/* id 1, wireType 0 =*/8).bool(message.bfFriend);
        if (message.remarkName != null && Object.hasOwnProperty.call(message, "remarkName"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.remarkName);
        if (message.status != null && Object.hasOwnProperty.call(message, "status"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.status);
        return writer;
    };

    /**
     * Encodes the specified FriendRelation message, length delimited. Does not implicitly {@link FriendRelation.verify|verify} messages.
     * @function encodeDelimited
     * @memberof FriendRelation
     * @static
     * @param {IFriendRelation} message FriendRelation message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    FriendRelation.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a FriendRelation message from the specified reader or buffer.
     * @function decode
     * @memberof FriendRelation
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {FriendRelation} FriendRelation
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    FriendRelation.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.FriendRelation();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.bfFriend = reader.bool();
                    break;
                }
            case 2: {
                    message.remarkName = reader.string();
                    break;
                }
            case 3: {
                    message.status = reader.int32();
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
     * Decodes a FriendRelation message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof FriendRelation
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {FriendRelation} FriendRelation
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    FriendRelation.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a FriendRelation message.
     * @function verify
     * @memberof FriendRelation
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    FriendRelation.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.bfFriend != null && message.hasOwnProperty("bfFriend"))
            if (typeof message.bfFriend !== "boolean")
                return "bfFriend: boolean expected";
        if (message.remarkName != null && message.hasOwnProperty("remarkName"))
            if (!$util.isString(message.remarkName))
                return "remarkName: string expected";
        if (message.status != null && message.hasOwnProperty("status"))
            if (!$util.isInteger(message.status))
                return "status: integer expected";
        return null;
    };

    /**
     * Creates a FriendRelation message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof FriendRelation
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {FriendRelation} FriendRelation
     */
    FriendRelation.fromObject = function fromObject(object) {
        if (object instanceof $root.FriendRelation)
            return object;
        let message = new $root.FriendRelation();
        if (object.bfFriend != null)
            message.bfFriend = Boolean(object.bfFriend);
        if (object.remarkName != null)
            message.remarkName = String(object.remarkName);
        if (object.status != null)
            message.status = object.status | 0;
        return message;
    };

    /**
     * Creates a plain object from a FriendRelation message. Also converts values to other types if specified.
     * @function toObject
     * @memberof FriendRelation
     * @static
     * @param {FriendRelation} message FriendRelation
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    FriendRelation.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.bfFriend = false;
            object.remarkName = "";
            object.status = 0;
        }
        if (message.bfFriend != null && message.hasOwnProperty("bfFriend"))
            object.bfFriend = message.bfFriend;
        if (message.remarkName != null && message.hasOwnProperty("remarkName"))
            object.remarkName = message.remarkName;
        if (message.status != null && message.hasOwnProperty("status"))
            object.status = message.status;
        return object;
    };

    /**
     * Converts this FriendRelation to JSON.
     * @function toJSON
     * @memberof FriendRelation
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    FriendRelation.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for FriendRelation
     * @function getTypeUrl
     * @memberof FriendRelation
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    FriendRelation.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/FriendRelation";
    };

    return FriendRelation;
})();

export const ArchiveInfo = $root.ArchiveInfo = (() => {

    /**
     * Properties of an ArchiveInfo.
     * @exports IArchiveInfo
     * @interface IArchiveInfo
     * @property {number|Long|null} [target] ArchiveInfo target
     * @property {number|Long|null} [type] ArchiveInfo type
     * @property {number|Long|null} [status] ArchiveInfo status
     */

    /**
     * Constructs a new ArchiveInfo.
     * @exports ArchiveInfo
     * @classdesc Represents an ArchiveInfo.
     * @implements IArchiveInfo
     * @constructor
     * @param {IArchiveInfo=} [properties] Properties to set
     */
    function ArchiveInfo(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ArchiveInfo target.
     * @member {number|Long} target
     * @memberof ArchiveInfo
     * @instance
     */
    ArchiveInfo.prototype.target = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * ArchiveInfo type.
     * @member {number|Long} type
     * @memberof ArchiveInfo
     * @instance
     */
    ArchiveInfo.prototype.type = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * ArchiveInfo status.
     * @member {number|Long} status
     * @memberof ArchiveInfo
     * @instance
     */
    ArchiveInfo.prototype.status = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new ArchiveInfo instance using the specified properties.
     * @function create
     * @memberof ArchiveInfo
     * @static
     * @param {IArchiveInfo=} [properties] Properties to set
     * @returns {ArchiveInfo} ArchiveInfo instance
     */
    ArchiveInfo.create = function create(properties) {
        return new ArchiveInfo(properties);
    };

    /**
     * Encodes the specified ArchiveInfo message. Does not implicitly {@link ArchiveInfo.verify|verify} messages.
     * @function encode
     * @memberof ArchiveInfo
     * @static
     * @param {IArchiveInfo} message ArchiveInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ArchiveInfo.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.target != null && Object.hasOwnProperty.call(message, "target"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.target);
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.type);
        if (message.status != null && Object.hasOwnProperty.call(message, "status"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.status);
        return writer;
    };

    /**
     * Encodes the specified ArchiveInfo message, length delimited. Does not implicitly {@link ArchiveInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ArchiveInfo
     * @static
     * @param {IArchiveInfo} message ArchiveInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ArchiveInfo.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an ArchiveInfo message from the specified reader or buffer.
     * @function decode
     * @memberof ArchiveInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ArchiveInfo} ArchiveInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ArchiveInfo.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.ArchiveInfo();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.target = reader.int64();
                    break;
                }
            case 2: {
                    message.type = reader.int64();
                    break;
                }
            case 3: {
                    message.status = reader.int64();
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
     * Decodes an ArchiveInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ArchiveInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ArchiveInfo} ArchiveInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ArchiveInfo.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an ArchiveInfo message.
     * @function verify
     * @memberof ArchiveInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ArchiveInfo.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.target != null && message.hasOwnProperty("target"))
            if (!$util.isInteger(message.target) && !(message.target && $util.isInteger(message.target.low) && $util.isInteger(message.target.high)))
                return "target: integer|Long expected";
        if (message.type != null && message.hasOwnProperty("type"))
            if (!$util.isInteger(message.type) && !(message.type && $util.isInteger(message.type.low) && $util.isInteger(message.type.high)))
                return "type: integer|Long expected";
        if (message.status != null && message.hasOwnProperty("status"))
            if (!$util.isInteger(message.status) && !(message.status && $util.isInteger(message.status.low) && $util.isInteger(message.status.high)))
                return "status: integer|Long expected";
        return null;
    };

    /**
     * Creates an ArchiveInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ArchiveInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ArchiveInfo} ArchiveInfo
     */
    ArchiveInfo.fromObject = function fromObject(object) {
        if (object instanceof $root.ArchiveInfo)
            return object;
        let message = new $root.ArchiveInfo();
        if (object.target != null)
            if ($util.Long)
                (message.target = $util.Long.fromValue(object.target)).unsigned = false;
            else if (typeof object.target === "string")
                message.target = parseInt(object.target, 10);
            else if (typeof object.target === "number")
                message.target = object.target;
            else if (typeof object.target === "object")
                message.target = new $util.LongBits(object.target.low >>> 0, object.target.high >>> 0).toNumber();
        if (object.type != null)
            if ($util.Long)
                (message.type = $util.Long.fromValue(object.type)).unsigned = false;
            else if (typeof object.type === "string")
                message.type = parseInt(object.type, 10);
            else if (typeof object.type === "number")
                message.type = object.type;
            else if (typeof object.type === "object")
                message.type = new $util.LongBits(object.type.low >>> 0, object.type.high >>> 0).toNumber();
        if (object.status != null)
            if ($util.Long)
                (message.status = $util.Long.fromValue(object.status)).unsigned = false;
            else if (typeof object.status === "string")
                message.status = parseInt(object.status, 10);
            else if (typeof object.status === "number")
                message.status = object.status;
            else if (typeof object.status === "object")
                message.status = new $util.LongBits(object.status.low >>> 0, object.status.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from an ArchiveInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ArchiveInfo
     * @static
     * @param {ArchiveInfo} message ArchiveInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ArchiveInfo.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.target = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.target = options.longs === String ? "0" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.type = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.type = options.longs === String ? "0" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.status = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.status = options.longs === String ? "0" : 0;
        }
        if (message.target != null && message.hasOwnProperty("target"))
            if (typeof message.target === "number")
                object.target = options.longs === String ? String(message.target) : message.target;
            else
                object.target = options.longs === String ? $util.Long.prototype.toString.call(message.target) : options.longs === Number ? new $util.LongBits(message.target.low >>> 0, message.target.high >>> 0).toNumber() : message.target;
        if (message.type != null && message.hasOwnProperty("type"))
            if (typeof message.type === "number")
                object.type = options.longs === String ? String(message.type) : message.type;
            else
                object.type = options.longs === String ? $util.Long.prototype.toString.call(message.type) : options.longs === Number ? new $util.LongBits(message.type.low >>> 0, message.type.high >>> 0).toNumber() : message.type;
        if (message.status != null && message.hasOwnProperty("status"))
            if (typeof message.status === "number")
                object.status = options.longs === String ? String(message.status) : message.status;
            else
                object.status = options.longs === String ? $util.Long.prototype.toString.call(message.status) : options.longs === Number ? new $util.LongBits(message.status.low >>> 0, message.status.high >>> 0).toNumber() : message.status;
        return object;
    };

    /**
     * Converts this ArchiveInfo to JSON.
     * @function toJSON
     * @memberof ArchiveInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ArchiveInfo.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ArchiveInfo
     * @function getTypeUrl
     * @memberof ArchiveInfo
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ArchiveInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/ArchiveInfo";
    };

    return ArchiveInfo;
})();

export const GroupMemberBase = $root.GroupMemberBase = (() => {

    /**
     * Properties of a GroupMemberBase.
     * @exports IGroupMemberBase
     * @interface IGroupMemberBase
     * @property {IUserBase|null} [user] GroupMemberBase user
     * @property {number|Long|null} [groupId] GroupMemberBase groupId
     * @property {GroupMemberType|null} [type] GroupMemberBase type
     * @property {string|null} [groupNickName] GroupMemberBase groupNickName
     * @property {number|Long|null} [score] GroupMemberBase score
     * @property {IAdminRightBase|null} [right] GroupMemberBase right
     * @property {boolean|null} [bfMyBlack] GroupMemberBase bfMyBlack
     * @property {number|null} [labelType] GroupMemberBase labelType
     */

    /**
     * Constructs a new GroupMemberBase.
     * @exports GroupMemberBase
     * @classdesc Represents a GroupMemberBase.
     * @implements IGroupMemberBase
     * @constructor
     * @param {IGroupMemberBase=} [properties] Properties to set
     */
    function GroupMemberBase(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupMemberBase user.
     * @member {IUserBase|null|undefined} user
     * @memberof GroupMemberBase
     * @instance
     */
    GroupMemberBase.prototype.user = null;

    /**
     * GroupMemberBase groupId.
     * @member {number|Long} groupId
     * @memberof GroupMemberBase
     * @instance
     */
    GroupMemberBase.prototype.groupId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupMemberBase type.
     * @member {GroupMemberType} type
     * @memberof GroupMemberBase
     * @instance
     */
    GroupMemberBase.prototype.type = 0;

    /**
     * GroupMemberBase groupNickName.
     * @member {string} groupNickName
     * @memberof GroupMemberBase
     * @instance
     */
    GroupMemberBase.prototype.groupNickName = "";

    /**
     * GroupMemberBase score.
     * @member {number|Long} score
     * @memberof GroupMemberBase
     * @instance
     */
    GroupMemberBase.prototype.score = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupMemberBase right.
     * @member {IAdminRightBase|null|undefined} right
     * @memberof GroupMemberBase
     * @instance
     */
    GroupMemberBase.prototype.right = null;

    /**
     * GroupMemberBase bfMyBlack.
     * @member {boolean} bfMyBlack
     * @memberof GroupMemberBase
     * @instance
     */
    GroupMemberBase.prototype.bfMyBlack = false;

    /**
     * GroupMemberBase labelType.
     * @member {number} labelType
     * @memberof GroupMemberBase
     * @instance
     */
    GroupMemberBase.prototype.labelType = 0;

    /**
     * Creates a new GroupMemberBase instance using the specified properties.
     * @function create
     * @memberof GroupMemberBase
     * @static
     * @param {IGroupMemberBase=} [properties] Properties to set
     * @returns {GroupMemberBase} GroupMemberBase instance
     */
    GroupMemberBase.create = function create(properties) {
        return new GroupMemberBase(properties);
    };

    /**
     * Encodes the specified GroupMemberBase message. Does not implicitly {@link GroupMemberBase.verify|verify} messages.
     * @function encode
     * @memberof GroupMemberBase
     * @static
     * @param {IGroupMemberBase} message GroupMemberBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupMemberBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.user != null && Object.hasOwnProperty.call(message, "user"))
            $root.UserBase.encode(message.user, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.groupId != null && Object.hasOwnProperty.call(message, "groupId"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.groupId);
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.type);
        if (message.groupNickName != null && Object.hasOwnProperty.call(message, "groupNickName"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.groupNickName);
        if (message.score != null && Object.hasOwnProperty.call(message, "score"))
            writer.uint32(/* id 5, wireType 0 =*/40).int64(message.score);
        if (message.right != null && Object.hasOwnProperty.call(message, "right"))
            $root.AdminRightBase.encode(message.right, writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
        if (message.bfMyBlack != null && Object.hasOwnProperty.call(message, "bfMyBlack"))
            writer.uint32(/* id 7, wireType 0 =*/56).bool(message.bfMyBlack);
        if (message.labelType != null && Object.hasOwnProperty.call(message, "labelType"))
            writer.uint32(/* id 8, wireType 0 =*/64).int32(message.labelType);
        return writer;
    };

    /**
     * Encodes the specified GroupMemberBase message, length delimited. Does not implicitly {@link GroupMemberBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupMemberBase
     * @static
     * @param {IGroupMemberBase} message GroupMemberBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupMemberBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupMemberBase message from the specified reader or buffer.
     * @function decode
     * @memberof GroupMemberBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupMemberBase} GroupMemberBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupMemberBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupMemberBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.user = $root.UserBase.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    message.groupId = reader.int64();
                    break;
                }
            case 3: {
                    message.type = reader.int32();
                    break;
                }
            case 4: {
                    message.groupNickName = reader.string();
                    break;
                }
            case 5: {
                    message.score = reader.int64();
                    break;
                }
            case 6: {
                    message.right = $root.AdminRightBase.decode(reader, reader.uint32());
                    break;
                }
            case 7: {
                    message.bfMyBlack = reader.bool();
                    break;
                }
            case 8: {
                    message.labelType = reader.int32();
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
     * Decodes a GroupMemberBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupMemberBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupMemberBase} GroupMemberBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupMemberBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupMemberBase message.
     * @function verify
     * @memberof GroupMemberBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupMemberBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.user != null && message.hasOwnProperty("user")) {
            let error = $root.UserBase.verify(message.user);
            if (error)
                return "user." + error;
        }
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (!$util.isInteger(message.groupId) && !(message.groupId && $util.isInteger(message.groupId.low) && $util.isInteger(message.groupId.high)))
                return "groupId: integer|Long expected";
        if (message.type != null && message.hasOwnProperty("type"))
            switch (message.type) {
            default:
                return "type: enum value expected";
            case 0:
            case 1:
            case 2:
                break;
            }
        if (message.groupNickName != null && message.hasOwnProperty("groupNickName"))
            if (!$util.isString(message.groupNickName))
                return "groupNickName: string expected";
        if (message.score != null && message.hasOwnProperty("score"))
            if (!$util.isInteger(message.score) && !(message.score && $util.isInteger(message.score.low) && $util.isInteger(message.score.high)))
                return "score: integer|Long expected";
        if (message.right != null && message.hasOwnProperty("right")) {
            let error = $root.AdminRightBase.verify(message.right);
            if (error)
                return "right." + error;
        }
        if (message.bfMyBlack != null && message.hasOwnProperty("bfMyBlack"))
            if (typeof message.bfMyBlack !== "boolean")
                return "bfMyBlack: boolean expected";
        if (message.labelType != null && message.hasOwnProperty("labelType"))
            if (!$util.isInteger(message.labelType))
                return "labelType: integer expected";
        return null;
    };

    /**
     * Creates a GroupMemberBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupMemberBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupMemberBase} GroupMemberBase
     */
    GroupMemberBase.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupMemberBase)
            return object;
        let message = new $root.GroupMemberBase();
        if (object.user != null) {
            if (typeof object.user !== "object")
                throw TypeError(".GroupMemberBase.user: object expected");
            message.user = $root.UserBase.fromObject(object.user);
        }
        if (object.groupId != null)
            if ($util.Long)
                (message.groupId = $util.Long.fromValue(object.groupId)).unsigned = false;
            else if (typeof object.groupId === "string")
                message.groupId = parseInt(object.groupId, 10);
            else if (typeof object.groupId === "number")
                message.groupId = object.groupId;
            else if (typeof object.groupId === "object")
                message.groupId = new $util.LongBits(object.groupId.low >>> 0, object.groupId.high >>> 0).toNumber();
        switch (object.type) {
        default:
            if (typeof object.type === "number") {
                message.type = object.type;
                break;
            }
            break;
        case "HOST":
        case 0:
            message.type = 0;
            break;
        case "MANAGE":
        case 1:
            message.type = 1;
            break;
        case "MEMBER":
        case 2:
            message.type = 2;
            break;
        }
        if (object.groupNickName != null)
            message.groupNickName = String(object.groupNickName);
        if (object.score != null)
            if ($util.Long)
                (message.score = $util.Long.fromValue(object.score)).unsigned = false;
            else if (typeof object.score === "string")
                message.score = parseInt(object.score, 10);
            else if (typeof object.score === "number")
                message.score = object.score;
            else if (typeof object.score === "object")
                message.score = new $util.LongBits(object.score.low >>> 0, object.score.high >>> 0).toNumber();
        if (object.right != null) {
            if (typeof object.right !== "object")
                throw TypeError(".GroupMemberBase.right: object expected");
            message.right = $root.AdminRightBase.fromObject(object.right);
        }
        if (object.bfMyBlack != null)
            message.bfMyBlack = Boolean(object.bfMyBlack);
        if (object.labelType != null)
            message.labelType = object.labelType | 0;
        return message;
    };

    /**
     * Creates a plain object from a GroupMemberBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupMemberBase
     * @static
     * @param {GroupMemberBase} message GroupMemberBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupMemberBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.user = null;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.groupId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.groupId = options.longs === String ? "0" : 0;
            object.type = options.enums === String ? "HOST" : 0;
            object.groupNickName = "";
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.score = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.score = options.longs === String ? "0" : 0;
            object.right = null;
            object.bfMyBlack = false;
            object.labelType = 0;
        }
        if (message.user != null && message.hasOwnProperty("user"))
            object.user = $root.UserBase.toObject(message.user, options);
        if (message.groupId != null && message.hasOwnProperty("groupId"))
            if (typeof message.groupId === "number")
                object.groupId = options.longs === String ? String(message.groupId) : message.groupId;
            else
                object.groupId = options.longs === String ? $util.Long.prototype.toString.call(message.groupId) : options.longs === Number ? new $util.LongBits(message.groupId.low >>> 0, message.groupId.high >>> 0).toNumber() : message.groupId;
        if (message.type != null && message.hasOwnProperty("type"))
            object.type = options.enums === String ? $root.GroupMemberType[message.type] === undefined ? message.type : $root.GroupMemberType[message.type] : message.type;
        if (message.groupNickName != null && message.hasOwnProperty("groupNickName"))
            object.groupNickName = message.groupNickName;
        if (message.score != null && message.hasOwnProperty("score"))
            if (typeof message.score === "number")
                object.score = options.longs === String ? String(message.score) : message.score;
            else
                object.score = options.longs === String ? $util.Long.prototype.toString.call(message.score) : options.longs === Number ? new $util.LongBits(message.score.low >>> 0, message.score.high >>> 0).toNumber() : message.score;
        if (message.right != null && message.hasOwnProperty("right"))
            object.right = $root.AdminRightBase.toObject(message.right, options);
        if (message.bfMyBlack != null && message.hasOwnProperty("bfMyBlack"))
            object.bfMyBlack = message.bfMyBlack;
        if (message.labelType != null && message.hasOwnProperty("labelType"))
            object.labelType = message.labelType;
        return object;
    };

    /**
     * Converts this GroupMemberBase to JSON.
     * @function toJSON
     * @memberof GroupMemberBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupMemberBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupMemberBase
     * @function getTypeUrl
     * @memberof GroupMemberBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupMemberBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupMemberBase";
    };

    return GroupMemberBase;
})();

export const ContactsDetailBase = $root.ContactsDetailBase = (() => {

    /**
     * Properties of a ContactsDetailBase.
     * @exports IContactsDetailBase
     * @interface IContactsDetailBase
     * @property {IUserBase|null} [userInfo] ContactsDetailBase userInfo
     * @property {string|null} [depict] ContactsDetailBase depict
     * @property {boolean|null} [bfStar] ContactsDetailBase bfStar
     * @property {boolean|null} [bfDisturb] ContactsDetailBase bfDisturb
     * @property {boolean|null} [bfMyBlack] ContactsDetailBase bfMyBlack
     * @property {string|null} [letter] ContactsDetailBase letter
     * @property {boolean|null} [bfTop] ContactsDetailBase bfTop
     * @property {boolean|null} [bfVerify] ContactsDetailBase bfVerify
     * @property {string|null} [signature] ContactsDetailBase signature
     * @property {string|null} [groupNickName] ContactsDetailBase groupNickName
     * @property {string|null} [phone] ContactsDetailBase phone
     * @property {boolean|null} [bfReadCancel] ContactsDetailBase bfReadCancel
     * @property {number|null} [msgCancelTime] ContactsDetailBase msgCancelTime
     * @property {boolean|null} [bfScreenshot] ContactsDetailBase bfScreenshot
     * @property {number|null} [commonGroupNum] ContactsDetailBase commonGroupNum
     * @property {boolean|null} [bfReadReceipt] ContactsDetailBase bfReadReceipt
     * @property {number|null} [groupShutupTime] ContactsDetailBase groupShutupTime
     * @property {number|null} [searchType] ContactsDetailBase searchType
     * @property {string|null} [addToken] ContactsDetailBase addToken
     * @property {boolean|null} [bfIdSearch] ContactsDetailBase bfIdSearch
     */

    /**
     * Constructs a new ContactsDetailBase.
     * @exports ContactsDetailBase
     * @classdesc Represents a ContactsDetailBase.
     * @implements IContactsDetailBase
     * @constructor
     * @param {IContactsDetailBase=} [properties] Properties to set
     */
    function ContactsDetailBase(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * ContactsDetailBase userInfo.
     * @member {IUserBase|null|undefined} userInfo
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.userInfo = null;

    /**
     * ContactsDetailBase depict.
     * @member {string} depict
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.depict = "";

    /**
     * ContactsDetailBase bfStar.
     * @member {boolean} bfStar
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.bfStar = false;

    /**
     * ContactsDetailBase bfDisturb.
     * @member {boolean} bfDisturb
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.bfDisturb = false;

    /**
     * ContactsDetailBase bfMyBlack.
     * @member {boolean} bfMyBlack
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.bfMyBlack = false;

    /**
     * ContactsDetailBase letter.
     * @member {string} letter
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.letter = "";

    /**
     * ContactsDetailBase bfTop.
     * @member {boolean} bfTop
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.bfTop = false;

    /**
     * ContactsDetailBase bfVerify.
     * @member {boolean} bfVerify
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.bfVerify = false;

    /**
     * ContactsDetailBase signature.
     * @member {string} signature
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.signature = "";

    /**
     * ContactsDetailBase groupNickName.
     * @member {string} groupNickName
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.groupNickName = "";

    /**
     * ContactsDetailBase phone.
     * @member {string} phone
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.phone = "";

    /**
     * ContactsDetailBase bfReadCancel.
     * @member {boolean} bfReadCancel
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.bfReadCancel = false;

    /**
     * ContactsDetailBase msgCancelTime.
     * @member {number} msgCancelTime
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.msgCancelTime = 0;

    /**
     * ContactsDetailBase bfScreenshot.
     * @member {boolean} bfScreenshot
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.bfScreenshot = false;

    /**
     * ContactsDetailBase commonGroupNum.
     * @member {number} commonGroupNum
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.commonGroupNum = 0;

    /**
     * ContactsDetailBase bfReadReceipt.
     * @member {boolean} bfReadReceipt
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.bfReadReceipt = false;

    /**
     * ContactsDetailBase groupShutupTime.
     * @member {number} groupShutupTime
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.groupShutupTime = 0;

    /**
     * ContactsDetailBase searchType.
     * @member {number} searchType
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.searchType = 0;

    /**
     * ContactsDetailBase addToken.
     * @member {string} addToken
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.addToken = "";

    /**
     * ContactsDetailBase bfIdSearch.
     * @member {boolean} bfIdSearch
     * @memberof ContactsDetailBase
     * @instance
     */
    ContactsDetailBase.prototype.bfIdSearch = false;

    /**
     * Creates a new ContactsDetailBase instance using the specified properties.
     * @function create
     * @memberof ContactsDetailBase
     * @static
     * @param {IContactsDetailBase=} [properties] Properties to set
     * @returns {ContactsDetailBase} ContactsDetailBase instance
     */
    ContactsDetailBase.create = function create(properties) {
        return new ContactsDetailBase(properties);
    };

    /**
     * Encodes the specified ContactsDetailBase message. Does not implicitly {@link ContactsDetailBase.verify|verify} messages.
     * @function encode
     * @memberof ContactsDetailBase
     * @static
     * @param {IContactsDetailBase} message ContactsDetailBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ContactsDetailBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.userInfo != null && Object.hasOwnProperty.call(message, "userInfo"))
            $root.UserBase.encode(message.userInfo, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.depict != null && Object.hasOwnProperty.call(message, "depict"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.depict);
        if (message.bfStar != null && Object.hasOwnProperty.call(message, "bfStar"))
            writer.uint32(/* id 3, wireType 0 =*/24).bool(message.bfStar);
        if (message.bfDisturb != null && Object.hasOwnProperty.call(message, "bfDisturb"))
            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.bfDisturb);
        if (message.bfMyBlack != null && Object.hasOwnProperty.call(message, "bfMyBlack"))
            writer.uint32(/* id 5, wireType 0 =*/40).bool(message.bfMyBlack);
        if (message.letter != null && Object.hasOwnProperty.call(message, "letter"))
            writer.uint32(/* id 6, wireType 2 =*/50).string(message.letter);
        if (message.bfTop != null && Object.hasOwnProperty.call(message, "bfTop"))
            writer.uint32(/* id 7, wireType 0 =*/56).bool(message.bfTop);
        if (message.bfVerify != null && Object.hasOwnProperty.call(message, "bfVerify"))
            writer.uint32(/* id 8, wireType 0 =*/64).bool(message.bfVerify);
        if (message.signature != null && Object.hasOwnProperty.call(message, "signature"))
            writer.uint32(/* id 9, wireType 2 =*/74).string(message.signature);
        if (message.groupNickName != null && Object.hasOwnProperty.call(message, "groupNickName"))
            writer.uint32(/* id 10, wireType 2 =*/82).string(message.groupNickName);
        if (message.phone != null && Object.hasOwnProperty.call(message, "phone"))
            writer.uint32(/* id 11, wireType 2 =*/90).string(message.phone);
        if (message.bfReadCancel != null && Object.hasOwnProperty.call(message, "bfReadCancel"))
            writer.uint32(/* id 12, wireType 0 =*/96).bool(message.bfReadCancel);
        if (message.msgCancelTime != null && Object.hasOwnProperty.call(message, "msgCancelTime"))
            writer.uint32(/* id 13, wireType 0 =*/104).int32(message.msgCancelTime);
        if (message.bfScreenshot != null && Object.hasOwnProperty.call(message, "bfScreenshot"))
            writer.uint32(/* id 14, wireType 0 =*/112).bool(message.bfScreenshot);
        if (message.commonGroupNum != null && Object.hasOwnProperty.call(message, "commonGroupNum"))
            writer.uint32(/* id 15, wireType 0 =*/120).int32(message.commonGroupNum);
        if (message.bfReadReceipt != null && Object.hasOwnProperty.call(message, "bfReadReceipt"))
            writer.uint32(/* id 16, wireType 0 =*/128).bool(message.bfReadReceipt);
        if (message.groupShutupTime != null && Object.hasOwnProperty.call(message, "groupShutupTime"))
            writer.uint32(/* id 17, wireType 0 =*/136).int32(message.groupShutupTime);
        if (message.searchType != null && Object.hasOwnProperty.call(message, "searchType"))
            writer.uint32(/* id 18, wireType 0 =*/144).int32(message.searchType);
        if (message.addToken != null && Object.hasOwnProperty.call(message, "addToken"))
            writer.uint32(/* id 19, wireType 2 =*/154).string(message.addToken);
        if (message.bfIdSearch != null && Object.hasOwnProperty.call(message, "bfIdSearch"))
            writer.uint32(/* id 20, wireType 0 =*/160).bool(message.bfIdSearch);
        return writer;
    };

    /**
     * Encodes the specified ContactsDetailBase message, length delimited. Does not implicitly {@link ContactsDetailBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof ContactsDetailBase
     * @static
     * @param {IContactsDetailBase} message ContactsDetailBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ContactsDetailBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a ContactsDetailBase message from the specified reader or buffer.
     * @function decode
     * @memberof ContactsDetailBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ContactsDetailBase} ContactsDetailBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ContactsDetailBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.ContactsDetailBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.userInfo = $root.UserBase.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    message.depict = reader.string();
                    break;
                }
            case 3: {
                    message.bfStar = reader.bool();
                    break;
                }
            case 4: {
                    message.bfDisturb = reader.bool();
                    break;
                }
            case 5: {
                    message.bfMyBlack = reader.bool();
                    break;
                }
            case 6: {
                    message.letter = reader.string();
                    break;
                }
            case 7: {
                    message.bfTop = reader.bool();
                    break;
                }
            case 8: {
                    message.bfVerify = reader.bool();
                    break;
                }
            case 9: {
                    message.signature = reader.string();
                    break;
                }
            case 10: {
                    message.groupNickName = reader.string();
                    break;
                }
            case 11: {
                    message.phone = reader.string();
                    break;
                }
            case 12: {
                    message.bfReadCancel = reader.bool();
                    break;
                }
            case 13: {
                    message.msgCancelTime = reader.int32();
                    break;
                }
            case 14: {
                    message.bfScreenshot = reader.bool();
                    break;
                }
            case 15: {
                    message.commonGroupNum = reader.int32();
                    break;
                }
            case 16: {
                    message.bfReadReceipt = reader.bool();
                    break;
                }
            case 17: {
                    message.groupShutupTime = reader.int32();
                    break;
                }
            case 18: {
                    message.searchType = reader.int32();
                    break;
                }
            case 19: {
                    message.addToken = reader.string();
                    break;
                }
            case 20: {
                    message.bfIdSearch = reader.bool();
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
     * Decodes a ContactsDetailBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof ContactsDetailBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {ContactsDetailBase} ContactsDetailBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ContactsDetailBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a ContactsDetailBase message.
     * @function verify
     * @memberof ContactsDetailBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    ContactsDetailBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.userInfo != null && message.hasOwnProperty("userInfo")) {
            let error = $root.UserBase.verify(message.userInfo);
            if (error)
                return "userInfo." + error;
        }
        if (message.depict != null && message.hasOwnProperty("depict"))
            if (!$util.isString(message.depict))
                return "depict: string expected";
        if (message.bfStar != null && message.hasOwnProperty("bfStar"))
            if (typeof message.bfStar !== "boolean")
                return "bfStar: boolean expected";
        if (message.bfDisturb != null && message.hasOwnProperty("bfDisturb"))
            if (typeof message.bfDisturb !== "boolean")
                return "bfDisturb: boolean expected";
        if (message.bfMyBlack != null && message.hasOwnProperty("bfMyBlack"))
            if (typeof message.bfMyBlack !== "boolean")
                return "bfMyBlack: boolean expected";
        if (message.letter != null && message.hasOwnProperty("letter"))
            if (!$util.isString(message.letter))
                return "letter: string expected";
        if (message.bfTop != null && message.hasOwnProperty("bfTop"))
            if (typeof message.bfTop !== "boolean")
                return "bfTop: boolean expected";
        if (message.bfVerify != null && message.hasOwnProperty("bfVerify"))
            if (typeof message.bfVerify !== "boolean")
                return "bfVerify: boolean expected";
        if (message.signature != null && message.hasOwnProperty("signature"))
            if (!$util.isString(message.signature))
                return "signature: string expected";
        if (message.groupNickName != null && message.hasOwnProperty("groupNickName"))
            if (!$util.isString(message.groupNickName))
                return "groupNickName: string expected";
        if (message.phone != null && message.hasOwnProperty("phone"))
            if (!$util.isString(message.phone))
                return "phone: string expected";
        if (message.bfReadCancel != null && message.hasOwnProperty("bfReadCancel"))
            if (typeof message.bfReadCancel !== "boolean")
                return "bfReadCancel: boolean expected";
        if (message.msgCancelTime != null && message.hasOwnProperty("msgCancelTime"))
            if (!$util.isInteger(message.msgCancelTime))
                return "msgCancelTime: integer expected";
        if (message.bfScreenshot != null && message.hasOwnProperty("bfScreenshot"))
            if (typeof message.bfScreenshot !== "boolean")
                return "bfScreenshot: boolean expected";
        if (message.commonGroupNum != null && message.hasOwnProperty("commonGroupNum"))
            if (!$util.isInteger(message.commonGroupNum))
                return "commonGroupNum: integer expected";
        if (message.bfReadReceipt != null && message.hasOwnProperty("bfReadReceipt"))
            if (typeof message.bfReadReceipt !== "boolean")
                return "bfReadReceipt: boolean expected";
        if (message.groupShutupTime != null && message.hasOwnProperty("groupShutupTime"))
            if (!$util.isInteger(message.groupShutupTime))
                return "groupShutupTime: integer expected";
        if (message.searchType != null && message.hasOwnProperty("searchType"))
            if (!$util.isInteger(message.searchType))
                return "searchType: integer expected";
        if (message.addToken != null && message.hasOwnProperty("addToken"))
            if (!$util.isString(message.addToken))
                return "addToken: string expected";
        if (message.bfIdSearch != null && message.hasOwnProperty("bfIdSearch"))
            if (typeof message.bfIdSearch !== "boolean")
                return "bfIdSearch: boolean expected";
        return null;
    };

    /**
     * Creates a ContactsDetailBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof ContactsDetailBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {ContactsDetailBase} ContactsDetailBase
     */
    ContactsDetailBase.fromObject = function fromObject(object) {
        if (object instanceof $root.ContactsDetailBase)
            return object;
        let message = new $root.ContactsDetailBase();
        if (object.userInfo != null) {
            if (typeof object.userInfo !== "object")
                throw TypeError(".ContactsDetailBase.userInfo: object expected");
            message.userInfo = $root.UserBase.fromObject(object.userInfo);
        }
        if (object.depict != null)
            message.depict = String(object.depict);
        if (object.bfStar != null)
            message.bfStar = Boolean(object.bfStar);
        if (object.bfDisturb != null)
            message.bfDisturb = Boolean(object.bfDisturb);
        if (object.bfMyBlack != null)
            message.bfMyBlack = Boolean(object.bfMyBlack);
        if (object.letter != null)
            message.letter = String(object.letter);
        if (object.bfTop != null)
            message.bfTop = Boolean(object.bfTop);
        if (object.bfVerify != null)
            message.bfVerify = Boolean(object.bfVerify);
        if (object.signature != null)
            message.signature = String(object.signature);
        if (object.groupNickName != null)
            message.groupNickName = String(object.groupNickName);
        if (object.phone != null)
            message.phone = String(object.phone);
        if (object.bfReadCancel != null)
            message.bfReadCancel = Boolean(object.bfReadCancel);
        if (object.msgCancelTime != null)
            message.msgCancelTime = object.msgCancelTime | 0;
        if (object.bfScreenshot != null)
            message.bfScreenshot = Boolean(object.bfScreenshot);
        if (object.commonGroupNum != null)
            message.commonGroupNum = object.commonGroupNum | 0;
        if (object.bfReadReceipt != null)
            message.bfReadReceipt = Boolean(object.bfReadReceipt);
        if (object.groupShutupTime != null)
            message.groupShutupTime = object.groupShutupTime | 0;
        if (object.searchType != null)
            message.searchType = object.searchType | 0;
        if (object.addToken != null)
            message.addToken = String(object.addToken);
        if (object.bfIdSearch != null)
            message.bfIdSearch = Boolean(object.bfIdSearch);
        return message;
    };

    /**
     * Creates a plain object from a ContactsDetailBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof ContactsDetailBase
     * @static
     * @param {ContactsDetailBase} message ContactsDetailBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    ContactsDetailBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.userInfo = null;
            object.depict = "";
            object.bfStar = false;
            object.bfDisturb = false;
            object.bfMyBlack = false;
            object.letter = "";
            object.bfTop = false;
            object.bfVerify = false;
            object.signature = "";
            object.groupNickName = "";
            object.phone = "";
            object.bfReadCancel = false;
            object.msgCancelTime = 0;
            object.bfScreenshot = false;
            object.commonGroupNum = 0;
            object.bfReadReceipt = false;
            object.groupShutupTime = 0;
            object.searchType = 0;
            object.addToken = "";
            object.bfIdSearch = false;
        }
        if (message.userInfo != null && message.hasOwnProperty("userInfo"))
            object.userInfo = $root.UserBase.toObject(message.userInfo, options);
        if (message.depict != null && message.hasOwnProperty("depict"))
            object.depict = message.depict;
        if (message.bfStar != null && message.hasOwnProperty("bfStar"))
            object.bfStar = message.bfStar;
        if (message.bfDisturb != null && message.hasOwnProperty("bfDisturb"))
            object.bfDisturb = message.bfDisturb;
        if (message.bfMyBlack != null && message.hasOwnProperty("bfMyBlack"))
            object.bfMyBlack = message.bfMyBlack;
        if (message.letter != null && message.hasOwnProperty("letter"))
            object.letter = message.letter;
        if (message.bfTop != null && message.hasOwnProperty("bfTop"))
            object.bfTop = message.bfTop;
        if (message.bfVerify != null && message.hasOwnProperty("bfVerify"))
            object.bfVerify = message.bfVerify;
        if (message.signature != null && message.hasOwnProperty("signature"))
            object.signature = message.signature;
        if (message.groupNickName != null && message.hasOwnProperty("groupNickName"))
            object.groupNickName = message.groupNickName;
        if (message.phone != null && message.hasOwnProperty("phone"))
            object.phone = message.phone;
        if (message.bfReadCancel != null && message.hasOwnProperty("bfReadCancel"))
            object.bfReadCancel = message.bfReadCancel;
        if (message.msgCancelTime != null && message.hasOwnProperty("msgCancelTime"))
            object.msgCancelTime = message.msgCancelTime;
        if (message.bfScreenshot != null && message.hasOwnProperty("bfScreenshot"))
            object.bfScreenshot = message.bfScreenshot;
        if (message.commonGroupNum != null && message.hasOwnProperty("commonGroupNum"))
            object.commonGroupNum = message.commonGroupNum;
        if (message.bfReadReceipt != null && message.hasOwnProperty("bfReadReceipt"))
            object.bfReadReceipt = message.bfReadReceipt;
        if (message.groupShutupTime != null && message.hasOwnProperty("groupShutupTime"))
            object.groupShutupTime = message.groupShutupTime;
        if (message.searchType != null && message.hasOwnProperty("searchType"))
            object.searchType = message.searchType;
        if (message.addToken != null && message.hasOwnProperty("addToken"))
            object.addToken = message.addToken;
        if (message.bfIdSearch != null && message.hasOwnProperty("bfIdSearch"))
            object.bfIdSearch = message.bfIdSearch;
        return object;
    };

    /**
     * Converts this ContactsDetailBase to JSON.
     * @function toJSON
     * @memberof ContactsDetailBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    ContactsDetailBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for ContactsDetailBase
     * @function getTypeUrl
     * @memberof ContactsDetailBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    ContactsDetailBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/ContactsDetailBase";
    };

    return ContactsDetailBase;
})();

export const MsgReceiptStatusBase = $root.MsgReceiptStatusBase = (() => {

    /**
     * Properties of a MsgReceiptStatusBase.
     * @exports IMsgReceiptStatusBase
     * @interface IMsgReceiptStatusBase
     * @property {MsgReceiptStatus|null} [status] MsgReceiptStatusBase status
     * @property {number|Long|null} [time] MsgReceiptStatusBase time
     */

    /**
     * Constructs a new MsgReceiptStatusBase.
     * @exports MsgReceiptStatusBase
     * @classdesc Represents a MsgReceiptStatusBase.
     * @implements IMsgReceiptStatusBase
     * @constructor
     * @param {IMsgReceiptStatusBase=} [properties] Properties to set
     */
    function MsgReceiptStatusBase(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * MsgReceiptStatusBase status.
     * @member {MsgReceiptStatus} status
     * @memberof MsgReceiptStatusBase
     * @instance
     */
    MsgReceiptStatusBase.prototype.status = 0;

    /**
     * MsgReceiptStatusBase time.
     * @member {number|Long} time
     * @memberof MsgReceiptStatusBase
     * @instance
     */
    MsgReceiptStatusBase.prototype.time = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * Creates a new MsgReceiptStatusBase instance using the specified properties.
     * @function create
     * @memberof MsgReceiptStatusBase
     * @static
     * @param {IMsgReceiptStatusBase=} [properties] Properties to set
     * @returns {MsgReceiptStatusBase} MsgReceiptStatusBase instance
     */
    MsgReceiptStatusBase.create = function create(properties) {
        return new MsgReceiptStatusBase(properties);
    };

    /**
     * Encodes the specified MsgReceiptStatusBase message. Does not implicitly {@link MsgReceiptStatusBase.verify|verify} messages.
     * @function encode
     * @memberof MsgReceiptStatusBase
     * @static
     * @param {IMsgReceiptStatusBase} message MsgReceiptStatusBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MsgReceiptStatusBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.status != null && Object.hasOwnProperty.call(message, "status"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.status);
        if (message.time != null && Object.hasOwnProperty.call(message, "time"))
            writer.uint32(/* id 2, wireType 0 =*/16).int64(message.time);
        return writer;
    };

    /**
     * Encodes the specified MsgReceiptStatusBase message, length delimited. Does not implicitly {@link MsgReceiptStatusBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof MsgReceiptStatusBase
     * @static
     * @param {IMsgReceiptStatusBase} message MsgReceiptStatusBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MsgReceiptStatusBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a MsgReceiptStatusBase message from the specified reader or buffer.
     * @function decode
     * @memberof MsgReceiptStatusBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {MsgReceiptStatusBase} MsgReceiptStatusBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MsgReceiptStatusBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.MsgReceiptStatusBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.status = reader.int32();
                    break;
                }
            case 2: {
                    message.time = reader.int64();
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
     * Decodes a MsgReceiptStatusBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof MsgReceiptStatusBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {MsgReceiptStatusBase} MsgReceiptStatusBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MsgReceiptStatusBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a MsgReceiptStatusBase message.
     * @function verify
     * @memberof MsgReceiptStatusBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    MsgReceiptStatusBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.status != null && message.hasOwnProperty("status"))
            switch (message.status) {
            default:
                return "status: enum value expected";
            case 0:
            case 1:
            case 2:
            case 3:
                break;
            }
        if (message.time != null && message.hasOwnProperty("time"))
            if (!$util.isInteger(message.time) && !(message.time && $util.isInteger(message.time.low) && $util.isInteger(message.time.high)))
                return "time: integer|Long expected";
        return null;
    };

    /**
     * Creates a MsgReceiptStatusBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof MsgReceiptStatusBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {MsgReceiptStatusBase} MsgReceiptStatusBase
     */
    MsgReceiptStatusBase.fromObject = function fromObject(object) {
        if (object instanceof $root.MsgReceiptStatusBase)
            return object;
        let message = new $root.MsgReceiptStatusBase();
        switch (object.status) {
        default:
            if (typeof object.status === "number") {
                message.status = object.status;
                break;
            }
            break;
        case "DELIVERED":
        case 0:
            message.status = 0;
            break;
        case "VIEWED":
        case 1:
            message.status = 1;
            break;
        case "PLAYED":
        case 2:
            message.status = 2;
            break;
        case "PROCESSED":
        case 3:
            message.status = 3;
            break;
        }
        if (object.time != null)
            if ($util.Long)
                (message.time = $util.Long.fromValue(object.time)).unsigned = false;
            else if (typeof object.time === "string")
                message.time = parseInt(object.time, 10);
            else if (typeof object.time === "number")
                message.time = object.time;
            else if (typeof object.time === "object")
                message.time = new $util.LongBits(object.time.low >>> 0, object.time.high >>> 0).toNumber();
        return message;
    };

    /**
     * Creates a plain object from a MsgReceiptStatusBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof MsgReceiptStatusBase
     * @static
     * @param {MsgReceiptStatusBase} message MsgReceiptStatusBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    MsgReceiptStatusBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.status = options.enums === String ? "DELIVERED" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.time = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.time = options.longs === String ? "0" : 0;
        }
        if (message.status != null && message.hasOwnProperty("status"))
            object.status = options.enums === String ? $root.MsgReceiptStatus[message.status] === undefined ? message.status : $root.MsgReceiptStatus[message.status] : message.status;
        if (message.time != null && message.hasOwnProperty("time"))
            if (typeof message.time === "number")
                object.time = options.longs === String ? String(message.time) : message.time;
            else
                object.time = options.longs === String ? $util.Long.prototype.toString.call(message.time) : options.longs === Number ? new $util.LongBits(message.time.low >>> 0, message.time.high >>> 0).toNumber() : message.time;
        return object;
    };

    /**
     * Converts this MsgReceiptStatusBase to JSON.
     * @function toJSON
     * @memberof MsgReceiptStatusBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    MsgReceiptStatusBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for MsgReceiptStatusBase
     * @function getTypeUrl
     * @memberof MsgReceiptStatusBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    MsgReceiptStatusBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/MsgReceiptStatusBase";
    };

    return MsgReceiptStatusBase;
})();

export const MsgReceiptBase = $root.MsgReceiptBase = (() => {

    /**
     * Properties of a MsgReceiptBase.
     * @exports IMsgReceiptBase
     * @interface IMsgReceiptBase
     * @property {IUserBase|null} [targetUser] MsgReceiptBase targetUser
     * @property {Array.<IMsgReceiptStatusBase>|null} [statusList] MsgReceiptBase statusList
     */

    /**
     * Constructs a new MsgReceiptBase.
     * @exports MsgReceiptBase
     * @classdesc Represents a MsgReceiptBase.
     * @implements IMsgReceiptBase
     * @constructor
     * @param {IMsgReceiptBase=} [properties] Properties to set
     */
    function MsgReceiptBase(properties) {
        this.statusList = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * MsgReceiptBase targetUser.
     * @member {IUserBase|null|undefined} targetUser
     * @memberof MsgReceiptBase
     * @instance
     */
    MsgReceiptBase.prototype.targetUser = null;

    /**
     * MsgReceiptBase statusList.
     * @member {Array.<IMsgReceiptStatusBase>} statusList
     * @memberof MsgReceiptBase
     * @instance
     */
    MsgReceiptBase.prototype.statusList = $util.emptyArray;

    /**
     * Creates a new MsgReceiptBase instance using the specified properties.
     * @function create
     * @memberof MsgReceiptBase
     * @static
     * @param {IMsgReceiptBase=} [properties] Properties to set
     * @returns {MsgReceiptBase} MsgReceiptBase instance
     */
    MsgReceiptBase.create = function create(properties) {
        return new MsgReceiptBase(properties);
    };

    /**
     * Encodes the specified MsgReceiptBase message. Does not implicitly {@link MsgReceiptBase.verify|verify} messages.
     * @function encode
     * @memberof MsgReceiptBase
     * @static
     * @param {IMsgReceiptBase} message MsgReceiptBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MsgReceiptBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.targetUser != null && Object.hasOwnProperty.call(message, "targetUser"))
            $root.UserBase.encode(message.targetUser, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.statusList != null && message.statusList.length)
            for (let i = 0; i < message.statusList.length; ++i)
                $root.MsgReceiptStatusBase.encode(message.statusList[i], writer.uint32(/* id 2, wireType 2 =*/18).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified MsgReceiptBase message, length delimited. Does not implicitly {@link MsgReceiptBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof MsgReceiptBase
     * @static
     * @param {IMsgReceiptBase} message MsgReceiptBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    MsgReceiptBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a MsgReceiptBase message from the specified reader or buffer.
     * @function decode
     * @memberof MsgReceiptBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {MsgReceiptBase} MsgReceiptBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MsgReceiptBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.MsgReceiptBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.targetUser = $root.UserBase.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    if (!(message.statusList && message.statusList.length))
                        message.statusList = [];
                    message.statusList.push($root.MsgReceiptStatusBase.decode(reader, reader.uint32()));
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
     * Decodes a MsgReceiptBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof MsgReceiptBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {MsgReceiptBase} MsgReceiptBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    MsgReceiptBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a MsgReceiptBase message.
     * @function verify
     * @memberof MsgReceiptBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    MsgReceiptBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.targetUser != null && message.hasOwnProperty("targetUser")) {
            let error = $root.UserBase.verify(message.targetUser);
            if (error)
                return "targetUser." + error;
        }
        if (message.statusList != null && message.hasOwnProperty("statusList")) {
            if (!Array.isArray(message.statusList))
                return "statusList: array expected";
            for (let i = 0; i < message.statusList.length; ++i) {
                let error = $root.MsgReceiptStatusBase.verify(message.statusList[i]);
                if (error)
                    return "statusList." + error;
            }
        }
        return null;
    };

    /**
     * Creates a MsgReceiptBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof MsgReceiptBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {MsgReceiptBase} MsgReceiptBase
     */
    MsgReceiptBase.fromObject = function fromObject(object) {
        if (object instanceof $root.MsgReceiptBase)
            return object;
        let message = new $root.MsgReceiptBase();
        if (object.targetUser != null) {
            if (typeof object.targetUser !== "object")
                throw TypeError(".MsgReceiptBase.targetUser: object expected");
            message.targetUser = $root.UserBase.fromObject(object.targetUser);
        }
        if (object.statusList) {
            if (!Array.isArray(object.statusList))
                throw TypeError(".MsgReceiptBase.statusList: array expected");
            message.statusList = [];
            for (let i = 0; i < object.statusList.length; ++i) {
                if (typeof object.statusList[i] !== "object")
                    throw TypeError(".MsgReceiptBase.statusList: object expected");
                message.statusList[i] = $root.MsgReceiptStatusBase.fromObject(object.statusList[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a MsgReceiptBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof MsgReceiptBase
     * @static
     * @param {MsgReceiptBase} message MsgReceiptBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    MsgReceiptBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.arrays || options.defaults)
            object.statusList = [];
        if (options.defaults)
            object.targetUser = null;
        if (message.targetUser != null && message.hasOwnProperty("targetUser"))
            object.targetUser = $root.UserBase.toObject(message.targetUser, options);
        if (message.statusList && message.statusList.length) {
            object.statusList = [];
            for (let j = 0; j < message.statusList.length; ++j)
                object.statusList[j] = $root.MsgReceiptStatusBase.toObject(message.statusList[j], options);
        }
        return object;
    };

    /**
     * Converts this MsgReceiptBase to JSON.
     * @function toJSON
     * @memberof MsgReceiptBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    MsgReceiptBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for MsgReceiptBase
     * @function getTypeUrl
     * @memberof MsgReceiptBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    MsgReceiptBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/MsgReceiptBase";
    };

    return MsgReceiptBase;
})();

export const UserOnOrOffLine = $root.UserOnOrOffLine = (() => {

    /**
     * Properties of a UserOnOrOffLine.
     * @exports IUserOnOrOffLine
     * @interface IUserOnOrOffLine
     * @property {number|Long|null} [uid] UserOnOrOffLine uid
     * @property {boolean|null} [online] UserOnOrOffLine online
     * @property {number|Long|null} [createTime] UserOnOrOffLine createTime
     * @property {boolean|null} [bfShow] UserOnOrOffLine bfShow
     */

    /**
     * Constructs a new UserOnOrOffLine.
     * @exports UserOnOrOffLine
     * @classdesc Represents a UserOnOrOffLine.
     * @implements IUserOnOrOffLine
     * @constructor
     * @param {IUserOnOrOffLine=} [properties] Properties to set
     */
    function UserOnOrOffLine(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * UserOnOrOffLine uid.
     * @member {number|Long} uid
     * @memberof UserOnOrOffLine
     * @instance
     */
    UserOnOrOffLine.prototype.uid = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * UserOnOrOffLine online.
     * @member {boolean} online
     * @memberof UserOnOrOffLine
     * @instance
     */
    UserOnOrOffLine.prototype.online = false;

    /**
     * UserOnOrOffLine createTime.
     * @member {number|Long} createTime
     * @memberof UserOnOrOffLine
     * @instance
     */
    UserOnOrOffLine.prototype.createTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * UserOnOrOffLine bfShow.
     * @member {boolean} bfShow
     * @memberof UserOnOrOffLine
     * @instance
     */
    UserOnOrOffLine.prototype.bfShow = false;

    /**
     * Creates a new UserOnOrOffLine instance using the specified properties.
     * @function create
     * @memberof UserOnOrOffLine
     * @static
     * @param {IUserOnOrOffLine=} [properties] Properties to set
     * @returns {UserOnOrOffLine} UserOnOrOffLine instance
     */
    UserOnOrOffLine.create = function create(properties) {
        return new UserOnOrOffLine(properties);
    };

    /**
     * Encodes the specified UserOnOrOffLine message. Does not implicitly {@link UserOnOrOffLine.verify|verify} messages.
     * @function encode
     * @memberof UserOnOrOffLine
     * @static
     * @param {IUserOnOrOffLine} message UserOnOrOffLine message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UserOnOrOffLine.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.uid != null && Object.hasOwnProperty.call(message, "uid"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.uid);
        if (message.online != null && Object.hasOwnProperty.call(message, "online"))
            writer.uint32(/* id 2, wireType 0 =*/16).bool(message.online);
        if (message.createTime != null && Object.hasOwnProperty.call(message, "createTime"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.createTime);
        if (message.bfShow != null && Object.hasOwnProperty.call(message, "bfShow"))
            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.bfShow);
        return writer;
    };

    /**
     * Encodes the specified UserOnOrOffLine message, length delimited. Does not implicitly {@link UserOnOrOffLine.verify|verify} messages.
     * @function encodeDelimited
     * @memberof UserOnOrOffLine
     * @static
     * @param {IUserOnOrOffLine} message UserOnOrOffLine message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    UserOnOrOffLine.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a UserOnOrOffLine message from the specified reader or buffer.
     * @function decode
     * @memberof UserOnOrOffLine
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {UserOnOrOffLine} UserOnOrOffLine
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UserOnOrOffLine.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.UserOnOrOffLine();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.uid = reader.int64();
                    break;
                }
            case 2: {
                    message.online = reader.bool();
                    break;
                }
            case 3: {
                    message.createTime = reader.int64();
                    break;
                }
            case 4: {
                    message.bfShow = reader.bool();
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
     * Decodes a UserOnOrOffLine message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof UserOnOrOffLine
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {UserOnOrOffLine} UserOnOrOffLine
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    UserOnOrOffLine.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a UserOnOrOffLine message.
     * @function verify
     * @memberof UserOnOrOffLine
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    UserOnOrOffLine.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.uid != null && message.hasOwnProperty("uid"))
            if (!$util.isInteger(message.uid) && !(message.uid && $util.isInteger(message.uid.low) && $util.isInteger(message.uid.high)))
                return "uid: integer|Long expected";
        if (message.online != null && message.hasOwnProperty("online"))
            if (typeof message.online !== "boolean")
                return "online: boolean expected";
        if (message.createTime != null && message.hasOwnProperty("createTime"))
            if (!$util.isInteger(message.createTime) && !(message.createTime && $util.isInteger(message.createTime.low) && $util.isInteger(message.createTime.high)))
                return "createTime: integer|Long expected";
        if (message.bfShow != null && message.hasOwnProperty("bfShow"))
            if (typeof message.bfShow !== "boolean")
                return "bfShow: boolean expected";
        return null;
    };

    /**
     * Creates a UserOnOrOffLine message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof UserOnOrOffLine
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {UserOnOrOffLine} UserOnOrOffLine
     */
    UserOnOrOffLine.fromObject = function fromObject(object) {
        if (object instanceof $root.UserOnOrOffLine)
            return object;
        let message = new $root.UserOnOrOffLine();
        if (object.uid != null)
            if ($util.Long)
                (message.uid = $util.Long.fromValue(object.uid)).unsigned = false;
            else if (typeof object.uid === "string")
                message.uid = parseInt(object.uid, 10);
            else if (typeof object.uid === "number")
                message.uid = object.uid;
            else if (typeof object.uid === "object")
                message.uid = new $util.LongBits(object.uid.low >>> 0, object.uid.high >>> 0).toNumber();
        if (object.online != null)
            message.online = Boolean(object.online);
        if (object.createTime != null)
            if ($util.Long)
                (message.createTime = $util.Long.fromValue(object.createTime)).unsigned = false;
            else if (typeof object.createTime === "string")
                message.createTime = parseInt(object.createTime, 10);
            else if (typeof object.createTime === "number")
                message.createTime = object.createTime;
            else if (typeof object.createTime === "object")
                message.createTime = new $util.LongBits(object.createTime.low >>> 0, object.createTime.high >>> 0).toNumber();
        if (object.bfShow != null)
            message.bfShow = Boolean(object.bfShow);
        return message;
    };

    /**
     * Creates a plain object from a UserOnOrOffLine message. Also converts values to other types if specified.
     * @function toObject
     * @memberof UserOnOrOffLine
     * @static
     * @param {UserOnOrOffLine} message UserOnOrOffLine
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    UserOnOrOffLine.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.uid = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.uid = options.longs === String ? "0" : 0;
            object.online = false;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.createTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.createTime = options.longs === String ? "0" : 0;
            object.bfShow = false;
        }
        if (message.uid != null && message.hasOwnProperty("uid"))
            if (typeof message.uid === "number")
                object.uid = options.longs === String ? String(message.uid) : message.uid;
            else
                object.uid = options.longs === String ? $util.Long.prototype.toString.call(message.uid) : options.longs === Number ? new $util.LongBits(message.uid.low >>> 0, message.uid.high >>> 0).toNumber() : message.uid;
        if (message.online != null && message.hasOwnProperty("online"))
            object.online = message.online;
        if (message.createTime != null && message.hasOwnProperty("createTime"))
            if (typeof message.createTime === "number")
                object.createTime = options.longs === String ? String(message.createTime) : message.createTime;
            else
                object.createTime = options.longs === String ? $util.Long.prototype.toString.call(message.createTime) : options.longs === Number ? new $util.LongBits(message.createTime.low >>> 0, message.createTime.high >>> 0).toNumber() : message.createTime;
        if (message.bfShow != null && message.hasOwnProperty("bfShow"))
            object.bfShow = message.bfShow;
        return object;
    };

    /**
     * Converts this UserOnOrOffLine to JSON.
     * @function toJSON
     * @memberof UserOnOrOffLine
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    UserOnOrOffLine.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for UserOnOrOffLine
     * @function getTypeUrl
     * @memberof UserOnOrOffLine
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    UserOnOrOffLine.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/UserOnOrOffLine";
    };

    return UserOnOrOffLine;
})();

export const KeyPairBase = $root.KeyPairBase = (() => {

    /**
     * Properties of a KeyPairBase.
     * @exports IKeyPairBase
     * @interface IKeyPairBase
     * @property {string|null} [publicKey] KeyPairBase publicKey
     * @property {string|null} [privateKey] KeyPairBase privateKey
     * @property {string|null} [msgKey] KeyPairBase msgKey
     * @property {number|null} [keyVersion] KeyPairBase keyVersion
     */

    /**
     * Constructs a new KeyPairBase.
     * @exports KeyPairBase
     * @classdesc Represents a KeyPairBase.
     * @implements IKeyPairBase
     * @constructor
     * @param {IKeyPairBase=} [properties] Properties to set
     */
    function KeyPairBase(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * KeyPairBase publicKey.
     * @member {string} publicKey
     * @memberof KeyPairBase
     * @instance
     */
    KeyPairBase.prototype.publicKey = "";

    /**
     * KeyPairBase privateKey.
     * @member {string} privateKey
     * @memberof KeyPairBase
     * @instance
     */
    KeyPairBase.prototype.privateKey = "";

    /**
     * KeyPairBase msgKey.
     * @member {string} msgKey
     * @memberof KeyPairBase
     * @instance
     */
    KeyPairBase.prototype.msgKey = "";

    /**
     * KeyPairBase keyVersion.
     * @member {number} keyVersion
     * @memberof KeyPairBase
     * @instance
     */
    KeyPairBase.prototype.keyVersion = 0;

    /**
     * Creates a new KeyPairBase instance using the specified properties.
     * @function create
     * @memberof KeyPairBase
     * @static
     * @param {IKeyPairBase=} [properties] Properties to set
     * @returns {KeyPairBase} KeyPairBase instance
     */
    KeyPairBase.create = function create(properties) {
        return new KeyPairBase(properties);
    };

    /**
     * Encodes the specified KeyPairBase message. Does not implicitly {@link KeyPairBase.verify|verify} messages.
     * @function encode
     * @memberof KeyPairBase
     * @static
     * @param {IKeyPairBase} message KeyPairBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    KeyPairBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.publicKey != null && Object.hasOwnProperty.call(message, "publicKey"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.publicKey);
        if (message.privateKey != null && Object.hasOwnProperty.call(message, "privateKey"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.privateKey);
        if (message.msgKey != null && Object.hasOwnProperty.call(message, "msgKey"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.msgKey);
        if (message.keyVersion != null && Object.hasOwnProperty.call(message, "keyVersion"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.keyVersion);
        return writer;
    };

    /**
     * Encodes the specified KeyPairBase message, length delimited. Does not implicitly {@link KeyPairBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof KeyPairBase
     * @static
     * @param {IKeyPairBase} message KeyPairBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    KeyPairBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a KeyPairBase message from the specified reader or buffer.
     * @function decode
     * @memberof KeyPairBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {KeyPairBase} KeyPairBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    KeyPairBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.KeyPairBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.publicKey = reader.string();
                    break;
                }
            case 2: {
                    message.privateKey = reader.string();
                    break;
                }
            case 3: {
                    message.msgKey = reader.string();
                    break;
                }
            case 4: {
                    message.keyVersion = reader.int32();
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
     * Decodes a KeyPairBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof KeyPairBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {KeyPairBase} KeyPairBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    KeyPairBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a KeyPairBase message.
     * @function verify
     * @memberof KeyPairBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    KeyPairBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.publicKey != null && message.hasOwnProperty("publicKey"))
            if (!$util.isString(message.publicKey))
                return "publicKey: string expected";
        if (message.privateKey != null && message.hasOwnProperty("privateKey"))
            if (!$util.isString(message.privateKey))
                return "privateKey: string expected";
        if (message.msgKey != null && message.hasOwnProperty("msgKey"))
            if (!$util.isString(message.msgKey))
                return "msgKey: string expected";
        if (message.keyVersion != null && message.hasOwnProperty("keyVersion"))
            if (!$util.isInteger(message.keyVersion))
                return "keyVersion: integer expected";
        return null;
    };

    /**
     * Creates a KeyPairBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof KeyPairBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {KeyPairBase} KeyPairBase
     */
    KeyPairBase.fromObject = function fromObject(object) {
        if (object instanceof $root.KeyPairBase)
            return object;
        let message = new $root.KeyPairBase();
        if (object.publicKey != null)
            message.publicKey = String(object.publicKey);
        if (object.privateKey != null)
            message.privateKey = String(object.privateKey);
        if (object.msgKey != null)
            message.msgKey = String(object.msgKey);
        if (object.keyVersion != null)
            message.keyVersion = object.keyVersion | 0;
        return message;
    };

    /**
     * Creates a plain object from a KeyPairBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof KeyPairBase
     * @static
     * @param {KeyPairBase} message KeyPairBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    KeyPairBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.publicKey = "";
            object.privateKey = "";
            object.msgKey = "";
            object.keyVersion = 0;
        }
        if (message.publicKey != null && message.hasOwnProperty("publicKey"))
            object.publicKey = message.publicKey;
        if (message.privateKey != null && message.hasOwnProperty("privateKey"))
            object.privateKey = message.privateKey;
        if (message.msgKey != null && message.hasOwnProperty("msgKey"))
            object.msgKey = message.msgKey;
        if (message.keyVersion != null && message.hasOwnProperty("keyVersion"))
            object.keyVersion = message.keyVersion;
        return object;
    };

    /**
     * Converts this KeyPairBase to JSON.
     * @function toJSON
     * @memberof KeyPairBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    KeyPairBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for KeyPairBase
     * @function getTypeUrl
     * @memberof KeyPairBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    KeyPairBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/KeyPairBase";
    };

    return KeyPairBase;
})();

export const AdminRightBase = $root.AdminRightBase = (() => {

    /**
     * Properties of an AdminRightBase.
     * @exports IAdminRightBase
     * @interface IAdminRightBase
     * @property {boolean|null} [bfUpdateData] AdminRightBase bfUpdateData
     * @property {boolean|null} [bfJoinCheck] AdminRightBase bfJoinCheck
     * @property {boolean|null} [bfPushNotice] AdminRightBase bfPushNotice
     * @property {boolean|null} [bfSetAdmin] AdminRightBase bfSetAdmin
     * @property {boolean|null} [bfResetQrcode] AdminRightBase bfResetQrcode
     * @property {boolean|null} [bfSetJoinNotice] AdminRightBase bfSetJoinNotice
     */

    /**
     * Constructs a new AdminRightBase.
     * @exports AdminRightBase
     * @classdesc Represents an AdminRightBase.
     * @implements IAdminRightBase
     * @constructor
     * @param {IAdminRightBase=} [properties] Properties to set
     */
    function AdminRightBase(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * AdminRightBase bfUpdateData.
     * @member {boolean} bfUpdateData
     * @memberof AdminRightBase
     * @instance
     */
    AdminRightBase.prototype.bfUpdateData = false;

    /**
     * AdminRightBase bfJoinCheck.
     * @member {boolean} bfJoinCheck
     * @memberof AdminRightBase
     * @instance
     */
    AdminRightBase.prototype.bfJoinCheck = false;

    /**
     * AdminRightBase bfPushNotice.
     * @member {boolean} bfPushNotice
     * @memberof AdminRightBase
     * @instance
     */
    AdminRightBase.prototype.bfPushNotice = false;

    /**
     * AdminRightBase bfSetAdmin.
     * @member {boolean} bfSetAdmin
     * @memberof AdminRightBase
     * @instance
     */
    AdminRightBase.prototype.bfSetAdmin = false;

    /**
     * AdminRightBase bfResetQrcode.
     * @member {boolean} bfResetQrcode
     * @memberof AdminRightBase
     * @instance
     */
    AdminRightBase.prototype.bfResetQrcode = false;

    /**
     * AdminRightBase bfSetJoinNotice.
     * @member {boolean} bfSetJoinNotice
     * @memberof AdminRightBase
     * @instance
     */
    AdminRightBase.prototype.bfSetJoinNotice = false;

    /**
     * Creates a new AdminRightBase instance using the specified properties.
     * @function create
     * @memberof AdminRightBase
     * @static
     * @param {IAdminRightBase=} [properties] Properties to set
     * @returns {AdminRightBase} AdminRightBase instance
     */
    AdminRightBase.create = function create(properties) {
        return new AdminRightBase(properties);
    };

    /**
     * Encodes the specified AdminRightBase message. Does not implicitly {@link AdminRightBase.verify|verify} messages.
     * @function encode
     * @memberof AdminRightBase
     * @static
     * @param {IAdminRightBase} message AdminRightBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    AdminRightBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.bfUpdateData != null && Object.hasOwnProperty.call(message, "bfUpdateData"))
            writer.uint32(/* id 1, wireType 0 =*/8).bool(message.bfUpdateData);
        if (message.bfJoinCheck != null && Object.hasOwnProperty.call(message, "bfJoinCheck"))
            writer.uint32(/* id 2, wireType 0 =*/16).bool(message.bfJoinCheck);
        if (message.bfPushNotice != null && Object.hasOwnProperty.call(message, "bfPushNotice"))
            writer.uint32(/* id 3, wireType 0 =*/24).bool(message.bfPushNotice);
        if (message.bfSetAdmin != null && Object.hasOwnProperty.call(message, "bfSetAdmin"))
            writer.uint32(/* id 4, wireType 0 =*/32).bool(message.bfSetAdmin);
        if (message.bfResetQrcode != null && Object.hasOwnProperty.call(message, "bfResetQrcode"))
            writer.uint32(/* id 5, wireType 0 =*/40).bool(message.bfResetQrcode);
        if (message.bfSetJoinNotice != null && Object.hasOwnProperty.call(message, "bfSetJoinNotice"))
            writer.uint32(/* id 6, wireType 0 =*/48).bool(message.bfSetJoinNotice);
        return writer;
    };

    /**
     * Encodes the specified AdminRightBase message, length delimited. Does not implicitly {@link AdminRightBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof AdminRightBase
     * @static
     * @param {IAdminRightBase} message AdminRightBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    AdminRightBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an AdminRightBase message from the specified reader or buffer.
     * @function decode
     * @memberof AdminRightBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {AdminRightBase} AdminRightBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    AdminRightBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.AdminRightBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.bfUpdateData = reader.bool();
                    break;
                }
            case 2: {
                    message.bfJoinCheck = reader.bool();
                    break;
                }
            case 3: {
                    message.bfPushNotice = reader.bool();
                    break;
                }
            case 4: {
                    message.bfSetAdmin = reader.bool();
                    break;
                }
            case 5: {
                    message.bfResetQrcode = reader.bool();
                    break;
                }
            case 6: {
                    message.bfSetJoinNotice = reader.bool();
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
     * Decodes an AdminRightBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof AdminRightBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {AdminRightBase} AdminRightBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    AdminRightBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an AdminRightBase message.
     * @function verify
     * @memberof AdminRightBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    AdminRightBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.bfUpdateData != null && message.hasOwnProperty("bfUpdateData"))
            if (typeof message.bfUpdateData !== "boolean")
                return "bfUpdateData: boolean expected";
        if (message.bfJoinCheck != null && message.hasOwnProperty("bfJoinCheck"))
            if (typeof message.bfJoinCheck !== "boolean")
                return "bfJoinCheck: boolean expected";
        if (message.bfPushNotice != null && message.hasOwnProperty("bfPushNotice"))
            if (typeof message.bfPushNotice !== "boolean")
                return "bfPushNotice: boolean expected";
        if (message.bfSetAdmin != null && message.hasOwnProperty("bfSetAdmin"))
            if (typeof message.bfSetAdmin !== "boolean")
                return "bfSetAdmin: boolean expected";
        if (message.bfResetQrcode != null && message.hasOwnProperty("bfResetQrcode"))
            if (typeof message.bfResetQrcode !== "boolean")
                return "bfResetQrcode: boolean expected";
        if (message.bfSetJoinNotice != null && message.hasOwnProperty("bfSetJoinNotice"))
            if (typeof message.bfSetJoinNotice !== "boolean")
                return "bfSetJoinNotice: boolean expected";
        return null;
    };

    /**
     * Creates an AdminRightBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof AdminRightBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {AdminRightBase} AdminRightBase
     */
    AdminRightBase.fromObject = function fromObject(object) {
        if (object instanceof $root.AdminRightBase)
            return object;
        let message = new $root.AdminRightBase();
        if (object.bfUpdateData != null)
            message.bfUpdateData = Boolean(object.bfUpdateData);
        if (object.bfJoinCheck != null)
            message.bfJoinCheck = Boolean(object.bfJoinCheck);
        if (object.bfPushNotice != null)
            message.bfPushNotice = Boolean(object.bfPushNotice);
        if (object.bfSetAdmin != null)
            message.bfSetAdmin = Boolean(object.bfSetAdmin);
        if (object.bfResetQrcode != null)
            message.bfResetQrcode = Boolean(object.bfResetQrcode);
        if (object.bfSetJoinNotice != null)
            message.bfSetJoinNotice = Boolean(object.bfSetJoinNotice);
        return message;
    };

    /**
     * Creates a plain object from an AdminRightBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof AdminRightBase
     * @static
     * @param {AdminRightBase} message AdminRightBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    AdminRightBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.bfUpdateData = false;
            object.bfJoinCheck = false;
            object.bfPushNotice = false;
            object.bfSetAdmin = false;
            object.bfResetQrcode = false;
            object.bfSetJoinNotice = false;
        }
        if (message.bfUpdateData != null && message.hasOwnProperty("bfUpdateData"))
            object.bfUpdateData = message.bfUpdateData;
        if (message.bfJoinCheck != null && message.hasOwnProperty("bfJoinCheck"))
            object.bfJoinCheck = message.bfJoinCheck;
        if (message.bfPushNotice != null && message.hasOwnProperty("bfPushNotice"))
            object.bfPushNotice = message.bfPushNotice;
        if (message.bfSetAdmin != null && message.hasOwnProperty("bfSetAdmin"))
            object.bfSetAdmin = message.bfSetAdmin;
        if (message.bfResetQrcode != null && message.hasOwnProperty("bfResetQrcode"))
            object.bfResetQrcode = message.bfResetQrcode;
        if (message.bfSetJoinNotice != null && message.hasOwnProperty("bfSetJoinNotice"))
            object.bfSetJoinNotice = message.bfSetJoinNotice;
        return object;
    };

    /**
     * Converts this AdminRightBase to JSON.
     * @function toJSON
     * @memberof AdminRightBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    AdminRightBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for AdminRightBase
     * @function getTypeUrl
     * @memberof AdminRightBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    AdminRightBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/AdminRightBase";
    };

    return AdminRightBase;
})();

export const GroupNoticeBase = $root.GroupNoticeBase = (() => {

    /**
     * Properties of a GroupNoticeBase.
     * @exports IGroupNoticeBase
     * @interface IGroupNoticeBase
     * @property {IGroupMemberBase|null} [editUser] GroupNoticeBase editUser
     * @property {string|null} [notice] GroupNoticeBase notice
     * @property {number|Long|null} [releaseTime] GroupNoticeBase releaseTime
     * @property {number|Long|null} [noticeId] GroupNoticeBase noticeId
     * @property {boolean|null} [bfRemind] GroupNoticeBase bfRemind
     */

    /**
     * Constructs a new GroupNoticeBase.
     * @exports GroupNoticeBase
     * @classdesc Represents a GroupNoticeBase.
     * @implements IGroupNoticeBase
     * @constructor
     * @param {IGroupNoticeBase=} [properties] Properties to set
     */
    function GroupNoticeBase(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * GroupNoticeBase editUser.
     * @member {IGroupMemberBase|null|undefined} editUser
     * @memberof GroupNoticeBase
     * @instance
     */
    GroupNoticeBase.prototype.editUser = null;

    /**
     * GroupNoticeBase notice.
     * @member {string} notice
     * @memberof GroupNoticeBase
     * @instance
     */
    GroupNoticeBase.prototype.notice = "";

    /**
     * GroupNoticeBase releaseTime.
     * @member {number|Long} releaseTime
     * @memberof GroupNoticeBase
     * @instance
     */
    GroupNoticeBase.prototype.releaseTime = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupNoticeBase noticeId.
     * @member {number|Long} noticeId
     * @memberof GroupNoticeBase
     * @instance
     */
    GroupNoticeBase.prototype.noticeId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * GroupNoticeBase bfRemind.
     * @member {boolean} bfRemind
     * @memberof GroupNoticeBase
     * @instance
     */
    GroupNoticeBase.prototype.bfRemind = false;

    /**
     * Creates a new GroupNoticeBase instance using the specified properties.
     * @function create
     * @memberof GroupNoticeBase
     * @static
     * @param {IGroupNoticeBase=} [properties] Properties to set
     * @returns {GroupNoticeBase} GroupNoticeBase instance
     */
    GroupNoticeBase.create = function create(properties) {
        return new GroupNoticeBase(properties);
    };

    /**
     * Encodes the specified GroupNoticeBase message. Does not implicitly {@link GroupNoticeBase.verify|verify} messages.
     * @function encode
     * @memberof GroupNoticeBase
     * @static
     * @param {IGroupNoticeBase} message GroupNoticeBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupNoticeBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.editUser != null && Object.hasOwnProperty.call(message, "editUser"))
            $root.GroupMemberBase.encode(message.editUser, writer.uint32(/* id 1, wireType 2 =*/10).fork()).ldelim();
        if (message.notice != null && Object.hasOwnProperty.call(message, "notice"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.notice);
        if (message.releaseTime != null && Object.hasOwnProperty.call(message, "releaseTime"))
            writer.uint32(/* id 3, wireType 0 =*/24).int64(message.releaseTime);
        if (message.noticeId != null && Object.hasOwnProperty.call(message, "noticeId"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.noticeId);
        if (message.bfRemind != null && Object.hasOwnProperty.call(message, "bfRemind"))
            writer.uint32(/* id 5, wireType 0 =*/40).bool(message.bfRemind);
        return writer;
    };

    /**
     * Encodes the specified GroupNoticeBase message, length delimited. Does not implicitly {@link GroupNoticeBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof GroupNoticeBase
     * @static
     * @param {IGroupNoticeBase} message GroupNoticeBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupNoticeBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a GroupNoticeBase message from the specified reader or buffer.
     * @function decode
     * @memberof GroupNoticeBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupNoticeBase} GroupNoticeBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupNoticeBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.GroupNoticeBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.editUser = $root.GroupMemberBase.decode(reader, reader.uint32());
                    break;
                }
            case 2: {
                    message.notice = reader.string();
                    break;
                }
            case 3: {
                    message.releaseTime = reader.int64();
                    break;
                }
            case 4: {
                    message.noticeId = reader.int64();
                    break;
                }
            case 5: {
                    message.bfRemind = reader.bool();
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
     * Decodes a GroupNoticeBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof GroupNoticeBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {GroupNoticeBase} GroupNoticeBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupNoticeBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a GroupNoticeBase message.
     * @function verify
     * @memberof GroupNoticeBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    GroupNoticeBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.editUser != null && message.hasOwnProperty("editUser")) {
            let error = $root.GroupMemberBase.verify(message.editUser);
            if (error)
                return "editUser." + error;
        }
        if (message.notice != null && message.hasOwnProperty("notice"))
            if (!$util.isString(message.notice))
                return "notice: string expected";
        if (message.releaseTime != null && message.hasOwnProperty("releaseTime"))
            if (!$util.isInteger(message.releaseTime) && !(message.releaseTime && $util.isInteger(message.releaseTime.low) && $util.isInteger(message.releaseTime.high)))
                return "releaseTime: integer|Long expected";
        if (message.noticeId != null && message.hasOwnProperty("noticeId"))
            if (!$util.isInteger(message.noticeId) && !(message.noticeId && $util.isInteger(message.noticeId.low) && $util.isInteger(message.noticeId.high)))
                return "noticeId: integer|Long expected";
        if (message.bfRemind != null && message.hasOwnProperty("bfRemind"))
            if (typeof message.bfRemind !== "boolean")
                return "bfRemind: boolean expected";
        return null;
    };

    /**
     * Creates a GroupNoticeBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof GroupNoticeBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {GroupNoticeBase} GroupNoticeBase
     */
    GroupNoticeBase.fromObject = function fromObject(object) {
        if (object instanceof $root.GroupNoticeBase)
            return object;
        let message = new $root.GroupNoticeBase();
        if (object.editUser != null) {
            if (typeof object.editUser !== "object")
                throw TypeError(".GroupNoticeBase.editUser: object expected");
            message.editUser = $root.GroupMemberBase.fromObject(object.editUser);
        }
        if (object.notice != null)
            message.notice = String(object.notice);
        if (object.releaseTime != null)
            if ($util.Long)
                (message.releaseTime = $util.Long.fromValue(object.releaseTime)).unsigned = false;
            else if (typeof object.releaseTime === "string")
                message.releaseTime = parseInt(object.releaseTime, 10);
            else if (typeof object.releaseTime === "number")
                message.releaseTime = object.releaseTime;
            else if (typeof object.releaseTime === "object")
                message.releaseTime = new $util.LongBits(object.releaseTime.low >>> 0, object.releaseTime.high >>> 0).toNumber();
        if (object.noticeId != null)
            if ($util.Long)
                (message.noticeId = $util.Long.fromValue(object.noticeId)).unsigned = false;
            else if (typeof object.noticeId === "string")
                message.noticeId = parseInt(object.noticeId, 10);
            else if (typeof object.noticeId === "number")
                message.noticeId = object.noticeId;
            else if (typeof object.noticeId === "object")
                message.noticeId = new $util.LongBits(object.noticeId.low >>> 0, object.noticeId.high >>> 0).toNumber();
        if (object.bfRemind != null)
            message.bfRemind = Boolean(object.bfRemind);
        return message;
    };

    /**
     * Creates a plain object from a GroupNoticeBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof GroupNoticeBase
     * @static
     * @param {GroupNoticeBase} message GroupNoticeBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    GroupNoticeBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.editUser = null;
            object.notice = "";
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.releaseTime = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.releaseTime = options.longs === String ? "0" : 0;
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.noticeId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.noticeId = options.longs === String ? "0" : 0;
            object.bfRemind = false;
        }
        if (message.editUser != null && message.hasOwnProperty("editUser"))
            object.editUser = $root.GroupMemberBase.toObject(message.editUser, options);
        if (message.notice != null && message.hasOwnProperty("notice"))
            object.notice = message.notice;
        if (message.releaseTime != null && message.hasOwnProperty("releaseTime"))
            if (typeof message.releaseTime === "number")
                object.releaseTime = options.longs === String ? String(message.releaseTime) : message.releaseTime;
            else
                object.releaseTime = options.longs === String ? $util.Long.prototype.toString.call(message.releaseTime) : options.longs === Number ? new $util.LongBits(message.releaseTime.low >>> 0, message.releaseTime.high >>> 0).toNumber() : message.releaseTime;
        if (message.noticeId != null && message.hasOwnProperty("noticeId"))
            if (typeof message.noticeId === "number")
                object.noticeId = options.longs === String ? String(message.noticeId) : message.noticeId;
            else
                object.noticeId = options.longs === String ? $util.Long.prototype.toString.call(message.noticeId) : options.longs === Number ? new $util.LongBits(message.noticeId.low >>> 0, message.noticeId.high >>> 0).toNumber() : message.noticeId;
        if (message.bfRemind != null && message.hasOwnProperty("bfRemind"))
            object.bfRemind = message.bfRemind;
        return object;
    };

    /**
     * Converts this GroupNoticeBase to JSON.
     * @function toJSON
     * @memberof GroupNoticeBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    GroupNoticeBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for GroupNoticeBase
     * @function getTypeUrl
     * @memberof GroupNoticeBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    GroupNoticeBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/GroupNoticeBase";
    };

    return GroupNoticeBase;
})();

export const EmoticonBase = $root.EmoticonBase = (() => {

    /**
     * Properties of an EmoticonBase.
     * @exports IEmoticonBase
     * @interface IEmoticonBase
     * @property {number|Long|null} [emoticonId] EmoticonBase emoticonId
     * @property {string|null} [emoticonUrl] EmoticonBase emoticonUrl
     * @property {number|null} [height] EmoticonBase height
     * @property {number|null} [width] EmoticonBase width
     * @property {number|null} [isEncryption] EmoticonBase isEncryption
     */

    /**
     * Constructs a new EmoticonBase.
     * @exports EmoticonBase
     * @classdesc Represents an EmoticonBase.
     * @implements IEmoticonBase
     * @constructor
     * @param {IEmoticonBase=} [properties] Properties to set
     */
    function EmoticonBase(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * EmoticonBase emoticonId.
     * @member {number|Long} emoticonId
     * @memberof EmoticonBase
     * @instance
     */
    EmoticonBase.prototype.emoticonId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * EmoticonBase emoticonUrl.
     * @member {string} emoticonUrl
     * @memberof EmoticonBase
     * @instance
     */
    EmoticonBase.prototype.emoticonUrl = "";

    /**
     * EmoticonBase height.
     * @member {number} height
     * @memberof EmoticonBase
     * @instance
     */
    EmoticonBase.prototype.height = 0;

    /**
     * EmoticonBase width.
     * @member {number} width
     * @memberof EmoticonBase
     * @instance
     */
    EmoticonBase.prototype.width = 0;

    /**
     * EmoticonBase isEncryption.
     * @member {number} isEncryption
     * @memberof EmoticonBase
     * @instance
     */
    EmoticonBase.prototype.isEncryption = 0;

    /**
     * Creates a new EmoticonBase instance using the specified properties.
     * @function create
     * @memberof EmoticonBase
     * @static
     * @param {IEmoticonBase=} [properties] Properties to set
     * @returns {EmoticonBase} EmoticonBase instance
     */
    EmoticonBase.create = function create(properties) {
        return new EmoticonBase(properties);
    };

    /**
     * Encodes the specified EmoticonBase message. Does not implicitly {@link EmoticonBase.verify|verify} messages.
     * @function encode
     * @memberof EmoticonBase
     * @static
     * @param {IEmoticonBase} message EmoticonBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    EmoticonBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.emoticonId != null && Object.hasOwnProperty.call(message, "emoticonId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.emoticonId);
        if (message.emoticonUrl != null && Object.hasOwnProperty.call(message, "emoticonUrl"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.emoticonUrl);
        if (message.height != null && Object.hasOwnProperty.call(message, "height"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.height);
        if (message.width != null && Object.hasOwnProperty.call(message, "width"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.width);
        if (message.isEncryption != null && Object.hasOwnProperty.call(message, "isEncryption"))
            writer.uint32(/* id 5, wireType 0 =*/40).int32(message.isEncryption);
        return writer;
    };

    /**
     * Encodes the specified EmoticonBase message, length delimited. Does not implicitly {@link EmoticonBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof EmoticonBase
     * @static
     * @param {IEmoticonBase} message EmoticonBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    EmoticonBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an EmoticonBase message from the specified reader or buffer.
     * @function decode
     * @memberof EmoticonBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {EmoticonBase} EmoticonBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    EmoticonBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.EmoticonBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.emoticonId = reader.int64();
                    break;
                }
            case 2: {
                    message.emoticonUrl = reader.string();
                    break;
                }
            case 3: {
                    message.height = reader.int32();
                    break;
                }
            case 4: {
                    message.width = reader.int32();
                    break;
                }
            case 5: {
                    message.isEncryption = reader.int32();
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
     * Decodes an EmoticonBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof EmoticonBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {EmoticonBase} EmoticonBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    EmoticonBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an EmoticonBase message.
     * @function verify
     * @memberof EmoticonBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    EmoticonBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.emoticonId != null && message.hasOwnProperty("emoticonId"))
            if (!$util.isInteger(message.emoticonId) && !(message.emoticonId && $util.isInteger(message.emoticonId.low) && $util.isInteger(message.emoticonId.high)))
                return "emoticonId: integer|Long expected";
        if (message.emoticonUrl != null && message.hasOwnProperty("emoticonUrl"))
            if (!$util.isString(message.emoticonUrl))
                return "emoticonUrl: string expected";
        if (message.height != null && message.hasOwnProperty("height"))
            if (!$util.isInteger(message.height))
                return "height: integer expected";
        if (message.width != null && message.hasOwnProperty("width"))
            if (!$util.isInteger(message.width))
                return "width: integer expected";
        if (message.isEncryption != null && message.hasOwnProperty("isEncryption"))
            if (!$util.isInteger(message.isEncryption))
                return "isEncryption: integer expected";
        return null;
    };

    /**
     * Creates an EmoticonBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof EmoticonBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {EmoticonBase} EmoticonBase
     */
    EmoticonBase.fromObject = function fromObject(object) {
        if (object instanceof $root.EmoticonBase)
            return object;
        let message = new $root.EmoticonBase();
        if (object.emoticonId != null)
            if ($util.Long)
                (message.emoticonId = $util.Long.fromValue(object.emoticonId)).unsigned = false;
            else if (typeof object.emoticonId === "string")
                message.emoticonId = parseInt(object.emoticonId, 10);
            else if (typeof object.emoticonId === "number")
                message.emoticonId = object.emoticonId;
            else if (typeof object.emoticonId === "object")
                message.emoticonId = new $util.LongBits(object.emoticonId.low >>> 0, object.emoticonId.high >>> 0).toNumber();
        if (object.emoticonUrl != null)
            message.emoticonUrl = String(object.emoticonUrl);
        if (object.height != null)
            message.height = object.height | 0;
        if (object.width != null)
            message.width = object.width | 0;
        if (object.isEncryption != null)
            message.isEncryption = object.isEncryption | 0;
        return message;
    };

    /**
     * Creates a plain object from an EmoticonBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof EmoticonBase
     * @static
     * @param {EmoticonBase} message EmoticonBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    EmoticonBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.emoticonId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.emoticonId = options.longs === String ? "0" : 0;
            object.emoticonUrl = "";
            object.height = 0;
            object.width = 0;
            object.isEncryption = 0;
        }
        if (message.emoticonId != null && message.hasOwnProperty("emoticonId"))
            if (typeof message.emoticonId === "number")
                object.emoticonId = options.longs === String ? String(message.emoticonId) : message.emoticonId;
            else
                object.emoticonId = options.longs === String ? $util.Long.prototype.toString.call(message.emoticonId) : options.longs === Number ? new $util.LongBits(message.emoticonId.low >>> 0, message.emoticonId.high >>> 0).toNumber() : message.emoticonId;
        if (message.emoticonUrl != null && message.hasOwnProperty("emoticonUrl"))
            object.emoticonUrl = message.emoticonUrl;
        if (message.height != null && message.hasOwnProperty("height"))
            object.height = message.height;
        if (message.width != null && message.hasOwnProperty("width"))
            object.width = message.width;
        if (message.isEncryption != null && message.hasOwnProperty("isEncryption"))
            object.isEncryption = message.isEncryption;
        return object;
    };

    /**
     * Converts this EmoticonBase to JSON.
     * @function toJSON
     * @memberof EmoticonBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    EmoticonBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for EmoticonBase
     * @function getTypeUrl
     * @memberof EmoticonBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    EmoticonBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/EmoticonBase";
    };

    return EmoticonBase;
})();

export const CoinLinkBase = $root.CoinLinkBase = (() => {

    /**
     * Properties of a CoinLinkBase.
     * @exports ICoinLinkBase
     * @interface ICoinLinkBase
     * @property {number|null} [coinId] CoinLinkBase coinId
     * @property {string|null} [linkName] CoinLinkBase linkName
     * @property {string|null} [minCash] CoinLinkBase minCash
     * @property {string|null} [maxCash] CoinLinkBase maxCash
     * @property {boolean|null} [isOpenCash] CoinLinkBase isOpenCash
     * @property {boolean|null} [isOpenRecharge] CoinLinkBase isOpenRecharge
     * @property {string|null} [minRecharge] CoinLinkBase minRecharge
     * @property {number|null} [tagType] CoinLinkBase tagType
     * @property {string|null} [tagName] CoinLinkBase tagName
     * @property {string|null} [blockConfirm] CoinLinkBase blockConfirm
     * @property {string|null} [cashTotal] CoinLinkBase cashTotal
     * @property {string|null} [feeCoin] CoinLinkBase feeCoin
     * @property {number|null} [showDecimal] CoinLinkBase showDecimal
     */

    /**
     * Constructs a new CoinLinkBase.
     * @exports CoinLinkBase
     * @classdesc Represents a CoinLinkBase.
     * @implements ICoinLinkBase
     * @constructor
     * @param {ICoinLinkBase=} [properties] Properties to set
     */
    function CoinLinkBase(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CoinLinkBase coinId.
     * @member {number} coinId
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.coinId = 0;

    /**
     * CoinLinkBase linkName.
     * @member {string} linkName
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.linkName = "";

    /**
     * CoinLinkBase minCash.
     * @member {string} minCash
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.minCash = "";

    /**
     * CoinLinkBase maxCash.
     * @member {string} maxCash
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.maxCash = "";

    /**
     * CoinLinkBase isOpenCash.
     * @member {boolean} isOpenCash
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.isOpenCash = false;

    /**
     * CoinLinkBase isOpenRecharge.
     * @member {boolean} isOpenRecharge
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.isOpenRecharge = false;

    /**
     * CoinLinkBase minRecharge.
     * @member {string} minRecharge
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.minRecharge = "";

    /**
     * CoinLinkBase tagType.
     * @member {number} tagType
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.tagType = 0;

    /**
     * CoinLinkBase tagName.
     * @member {string} tagName
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.tagName = "";

    /**
     * CoinLinkBase blockConfirm.
     * @member {string} blockConfirm
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.blockConfirm = "";

    /**
     * CoinLinkBase cashTotal.
     * @member {string} cashTotal
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.cashTotal = "";

    /**
     * CoinLinkBase feeCoin.
     * @member {string} feeCoin
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.feeCoin = "";

    /**
     * CoinLinkBase showDecimal.
     * @member {number} showDecimal
     * @memberof CoinLinkBase
     * @instance
     */
    CoinLinkBase.prototype.showDecimal = 0;

    /**
     * Creates a new CoinLinkBase instance using the specified properties.
     * @function create
     * @memberof CoinLinkBase
     * @static
     * @param {ICoinLinkBase=} [properties] Properties to set
     * @returns {CoinLinkBase} CoinLinkBase instance
     */
    CoinLinkBase.create = function create(properties) {
        return new CoinLinkBase(properties);
    };

    /**
     * Encodes the specified CoinLinkBase message. Does not implicitly {@link CoinLinkBase.verify|verify} messages.
     * @function encode
     * @memberof CoinLinkBase
     * @static
     * @param {ICoinLinkBase} message CoinLinkBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CoinLinkBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.coinId != null && Object.hasOwnProperty.call(message, "coinId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.coinId);
        if (message.linkName != null && Object.hasOwnProperty.call(message, "linkName"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.linkName);
        if (message.minCash != null && Object.hasOwnProperty.call(message, "minCash"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.minCash);
        if (message.maxCash != null && Object.hasOwnProperty.call(message, "maxCash"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.maxCash);
        if (message.isOpenCash != null && Object.hasOwnProperty.call(message, "isOpenCash"))
            writer.uint32(/* id 5, wireType 0 =*/40).bool(message.isOpenCash);
        if (message.isOpenRecharge != null && Object.hasOwnProperty.call(message, "isOpenRecharge"))
            writer.uint32(/* id 6, wireType 0 =*/48).bool(message.isOpenRecharge);
        if (message.minRecharge != null && Object.hasOwnProperty.call(message, "minRecharge"))
            writer.uint32(/* id 7, wireType 2 =*/58).string(message.minRecharge);
        if (message.tagType != null && Object.hasOwnProperty.call(message, "tagType"))
            writer.uint32(/* id 8, wireType 0 =*/64).int32(message.tagType);
        if (message.tagName != null && Object.hasOwnProperty.call(message, "tagName"))
            writer.uint32(/* id 9, wireType 2 =*/74).string(message.tagName);
        if (message.blockConfirm != null && Object.hasOwnProperty.call(message, "blockConfirm"))
            writer.uint32(/* id 10, wireType 2 =*/82).string(message.blockConfirm);
        if (message.cashTotal != null && Object.hasOwnProperty.call(message, "cashTotal"))
            writer.uint32(/* id 11, wireType 2 =*/90).string(message.cashTotal);
        if (message.feeCoin != null && Object.hasOwnProperty.call(message, "feeCoin"))
            writer.uint32(/* id 12, wireType 2 =*/98).string(message.feeCoin);
        if (message.showDecimal != null && Object.hasOwnProperty.call(message, "showDecimal"))
            writer.uint32(/* id 13, wireType 0 =*/104).int32(message.showDecimal);
        return writer;
    };

    /**
     * Encodes the specified CoinLinkBase message, length delimited. Does not implicitly {@link CoinLinkBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CoinLinkBase
     * @static
     * @param {ICoinLinkBase} message CoinLinkBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CoinLinkBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CoinLinkBase message from the specified reader or buffer.
     * @function decode
     * @memberof CoinLinkBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CoinLinkBase} CoinLinkBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CoinLinkBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CoinLinkBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.coinId = reader.int32();
                    break;
                }
            case 2: {
                    message.linkName = reader.string();
                    break;
                }
            case 3: {
                    message.minCash = reader.string();
                    break;
                }
            case 4: {
                    message.maxCash = reader.string();
                    break;
                }
            case 5: {
                    message.isOpenCash = reader.bool();
                    break;
                }
            case 6: {
                    message.isOpenRecharge = reader.bool();
                    break;
                }
            case 7: {
                    message.minRecharge = reader.string();
                    break;
                }
            case 8: {
                    message.tagType = reader.int32();
                    break;
                }
            case 9: {
                    message.tagName = reader.string();
                    break;
                }
            case 10: {
                    message.blockConfirm = reader.string();
                    break;
                }
            case 11: {
                    message.cashTotal = reader.string();
                    break;
                }
            case 12: {
                    message.feeCoin = reader.string();
                    break;
                }
            case 13: {
                    message.showDecimal = reader.int32();
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
     * Decodes a CoinLinkBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CoinLinkBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CoinLinkBase} CoinLinkBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CoinLinkBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CoinLinkBase message.
     * @function verify
     * @memberof CoinLinkBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CoinLinkBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.coinId != null && message.hasOwnProperty("coinId"))
            if (!$util.isInteger(message.coinId))
                return "coinId: integer expected";
        if (message.linkName != null && message.hasOwnProperty("linkName"))
            if (!$util.isString(message.linkName))
                return "linkName: string expected";
        if (message.minCash != null && message.hasOwnProperty("minCash"))
            if (!$util.isString(message.minCash))
                return "minCash: string expected";
        if (message.maxCash != null && message.hasOwnProperty("maxCash"))
            if (!$util.isString(message.maxCash))
                return "maxCash: string expected";
        if (message.isOpenCash != null && message.hasOwnProperty("isOpenCash"))
            if (typeof message.isOpenCash !== "boolean")
                return "isOpenCash: boolean expected";
        if (message.isOpenRecharge != null && message.hasOwnProperty("isOpenRecharge"))
            if (typeof message.isOpenRecharge !== "boolean")
                return "isOpenRecharge: boolean expected";
        if (message.minRecharge != null && message.hasOwnProperty("minRecharge"))
            if (!$util.isString(message.minRecharge))
                return "minRecharge: string expected";
        if (message.tagType != null && message.hasOwnProperty("tagType"))
            if (!$util.isInteger(message.tagType))
                return "tagType: integer expected";
        if (message.tagName != null && message.hasOwnProperty("tagName"))
            if (!$util.isString(message.tagName))
                return "tagName: string expected";
        if (message.blockConfirm != null && message.hasOwnProperty("blockConfirm"))
            if (!$util.isString(message.blockConfirm))
                return "blockConfirm: string expected";
        if (message.cashTotal != null && message.hasOwnProperty("cashTotal"))
            if (!$util.isString(message.cashTotal))
                return "cashTotal: string expected";
        if (message.feeCoin != null && message.hasOwnProperty("feeCoin"))
            if (!$util.isString(message.feeCoin))
                return "feeCoin: string expected";
        if (message.showDecimal != null && message.hasOwnProperty("showDecimal"))
            if (!$util.isInteger(message.showDecimal))
                return "showDecimal: integer expected";
        return null;
    };

    /**
     * Creates a CoinLinkBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CoinLinkBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CoinLinkBase} CoinLinkBase
     */
    CoinLinkBase.fromObject = function fromObject(object) {
        if (object instanceof $root.CoinLinkBase)
            return object;
        let message = new $root.CoinLinkBase();
        if (object.coinId != null)
            message.coinId = object.coinId | 0;
        if (object.linkName != null)
            message.linkName = String(object.linkName);
        if (object.minCash != null)
            message.minCash = String(object.minCash);
        if (object.maxCash != null)
            message.maxCash = String(object.maxCash);
        if (object.isOpenCash != null)
            message.isOpenCash = Boolean(object.isOpenCash);
        if (object.isOpenRecharge != null)
            message.isOpenRecharge = Boolean(object.isOpenRecharge);
        if (object.minRecharge != null)
            message.minRecharge = String(object.minRecharge);
        if (object.tagType != null)
            message.tagType = object.tagType | 0;
        if (object.tagName != null)
            message.tagName = String(object.tagName);
        if (object.blockConfirm != null)
            message.blockConfirm = String(object.blockConfirm);
        if (object.cashTotal != null)
            message.cashTotal = String(object.cashTotal);
        if (object.feeCoin != null)
            message.feeCoin = String(object.feeCoin);
        if (object.showDecimal != null)
            message.showDecimal = object.showDecimal | 0;
        return message;
    };

    /**
     * Creates a plain object from a CoinLinkBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CoinLinkBase
     * @static
     * @param {CoinLinkBase} message CoinLinkBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CoinLinkBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.coinId = 0;
            object.linkName = "";
            object.minCash = "";
            object.maxCash = "";
            object.isOpenCash = false;
            object.isOpenRecharge = false;
            object.minRecharge = "";
            object.tagType = 0;
            object.tagName = "";
            object.blockConfirm = "";
            object.cashTotal = "";
            object.feeCoin = "";
            object.showDecimal = 0;
        }
        if (message.coinId != null && message.hasOwnProperty("coinId"))
            object.coinId = message.coinId;
        if (message.linkName != null && message.hasOwnProperty("linkName"))
            object.linkName = message.linkName;
        if (message.minCash != null && message.hasOwnProperty("minCash"))
            object.minCash = message.minCash;
        if (message.maxCash != null && message.hasOwnProperty("maxCash"))
            object.maxCash = message.maxCash;
        if (message.isOpenCash != null && message.hasOwnProperty("isOpenCash"))
            object.isOpenCash = message.isOpenCash;
        if (message.isOpenRecharge != null && message.hasOwnProperty("isOpenRecharge"))
            object.isOpenRecharge = message.isOpenRecharge;
        if (message.minRecharge != null && message.hasOwnProperty("minRecharge"))
            object.minRecharge = message.minRecharge;
        if (message.tagType != null && message.hasOwnProperty("tagType"))
            object.tagType = message.tagType;
        if (message.tagName != null && message.hasOwnProperty("tagName"))
            object.tagName = message.tagName;
        if (message.blockConfirm != null && message.hasOwnProperty("blockConfirm"))
            object.blockConfirm = message.blockConfirm;
        if (message.cashTotal != null && message.hasOwnProperty("cashTotal"))
            object.cashTotal = message.cashTotal;
        if (message.feeCoin != null && message.hasOwnProperty("feeCoin"))
            object.feeCoin = message.feeCoin;
        if (message.showDecimal != null && message.hasOwnProperty("showDecimal"))
            object.showDecimal = message.showDecimal;
        return object;
    };

    /**
     * Converts this CoinLinkBase to JSON.
     * @function toJSON
     * @memberof CoinLinkBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CoinLinkBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CoinLinkBase
     * @function getTypeUrl
     * @memberof CoinLinkBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CoinLinkBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CoinLinkBase";
    };

    return CoinLinkBase;
})();

export const CoinTypeBase = $root.CoinTypeBase = (() => {

    /**
     * Properties of a CoinTypeBase.
     * @exports ICoinTypeBase
     * @interface ICoinTypeBase
     * @property {number|null} [id] CoinTypeBase id
     * @property {string|null} [name] CoinTypeBase name
     * @property {string|null} [desc] CoinTypeBase desc
     * @property {string|null} [icon] CoinTypeBase icon
     * @property {string|null} [letter] CoinTypeBase letter
     * @property {Array.<ICoinLinkBase>|null} [link] CoinTypeBase link
     * @property {string|null} [minCash] CoinTypeBase minCash
     * @property {string|null} [maxCash] CoinTypeBase maxCash
     * @property {boolean|null} [isOpenCash] CoinTypeBase isOpenCash
     * @property {boolean|null} [isOpenRecharge] CoinTypeBase isOpenRecharge
     * @property {string|null} [minRecharge] CoinTypeBase minRecharge
     * @property {number|null} [tagType] CoinTypeBase tagType
     * @property {string|null} [tagName] CoinTypeBase tagName
     * @property {string|null} [blockConfirm] CoinTypeBase blockConfirm
     * @property {string|null} [cashTotal] CoinTypeBase cashTotal
     * @property {string|null} [feeCoin] CoinTypeBase feeCoin
     * @property {number|null} [showDecimal] CoinTypeBase showDecimal
     * @property {string|null} [symbol] CoinTypeBase symbol
     * @property {string|null} [alias] CoinTypeBase alias
     */

    /**
     * Constructs a new CoinTypeBase.
     * @exports CoinTypeBase
     * @classdesc Represents a CoinTypeBase.
     * @implements ICoinTypeBase
     * @constructor
     * @param {ICoinTypeBase=} [properties] Properties to set
     */
    function CoinTypeBase(properties) {
        this.link = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CoinTypeBase id.
     * @member {number} id
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.id = 0;

    /**
     * CoinTypeBase name.
     * @member {string} name
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.name = "";

    /**
     * CoinTypeBase desc.
     * @member {string} desc
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.desc = "";

    /**
     * CoinTypeBase icon.
     * @member {string} icon
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.icon = "";

    /**
     * CoinTypeBase letter.
     * @member {string} letter
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.letter = "";

    /**
     * CoinTypeBase link.
     * @member {Array.<ICoinLinkBase>} link
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.link = $util.emptyArray;

    /**
     * CoinTypeBase minCash.
     * @member {string} minCash
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.minCash = "";

    /**
     * CoinTypeBase maxCash.
     * @member {string} maxCash
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.maxCash = "";

    /**
     * CoinTypeBase isOpenCash.
     * @member {boolean} isOpenCash
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.isOpenCash = false;

    /**
     * CoinTypeBase isOpenRecharge.
     * @member {boolean} isOpenRecharge
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.isOpenRecharge = false;

    /**
     * CoinTypeBase minRecharge.
     * @member {string} minRecharge
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.minRecharge = "";

    /**
     * CoinTypeBase tagType.
     * @member {number} tagType
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.tagType = 0;

    /**
     * CoinTypeBase tagName.
     * @member {string} tagName
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.tagName = "";

    /**
     * CoinTypeBase blockConfirm.
     * @member {string} blockConfirm
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.blockConfirm = "";

    /**
     * CoinTypeBase cashTotal.
     * @member {string} cashTotal
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.cashTotal = "";

    /**
     * CoinTypeBase feeCoin.
     * @member {string} feeCoin
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.feeCoin = "";

    /**
     * CoinTypeBase showDecimal.
     * @member {number} showDecimal
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.showDecimal = 0;

    /**
     * CoinTypeBase symbol.
     * @member {string} symbol
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.symbol = "";

    /**
     * CoinTypeBase alias.
     * @member {string} alias
     * @memberof CoinTypeBase
     * @instance
     */
    CoinTypeBase.prototype.alias = "";

    /**
     * Creates a new CoinTypeBase instance using the specified properties.
     * @function create
     * @memberof CoinTypeBase
     * @static
     * @param {ICoinTypeBase=} [properties] Properties to set
     * @returns {CoinTypeBase} CoinTypeBase instance
     */
    CoinTypeBase.create = function create(properties) {
        return new CoinTypeBase(properties);
    };

    /**
     * Encodes the specified CoinTypeBase message. Does not implicitly {@link CoinTypeBase.verify|verify} messages.
     * @function encode
     * @memberof CoinTypeBase
     * @static
     * @param {ICoinTypeBase} message CoinTypeBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CoinTypeBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.id != null && Object.hasOwnProperty.call(message, "id"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.id);
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
        if (message.desc != null && Object.hasOwnProperty.call(message, "desc"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.desc);
        if (message.icon != null && Object.hasOwnProperty.call(message, "icon"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.icon);
        if (message.letter != null && Object.hasOwnProperty.call(message, "letter"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.letter);
        if (message.link != null && message.link.length)
            for (let i = 0; i < message.link.length; ++i)
                $root.CoinLinkBase.encode(message.link[i], writer.uint32(/* id 6, wireType 2 =*/50).fork()).ldelim();
        if (message.minCash != null && Object.hasOwnProperty.call(message, "minCash"))
            writer.uint32(/* id 7, wireType 2 =*/58).string(message.minCash);
        if (message.maxCash != null && Object.hasOwnProperty.call(message, "maxCash"))
            writer.uint32(/* id 8, wireType 2 =*/66).string(message.maxCash);
        if (message.isOpenCash != null && Object.hasOwnProperty.call(message, "isOpenCash"))
            writer.uint32(/* id 9, wireType 0 =*/72).bool(message.isOpenCash);
        if (message.isOpenRecharge != null && Object.hasOwnProperty.call(message, "isOpenRecharge"))
            writer.uint32(/* id 10, wireType 0 =*/80).bool(message.isOpenRecharge);
        if (message.minRecharge != null && Object.hasOwnProperty.call(message, "minRecharge"))
            writer.uint32(/* id 11, wireType 2 =*/90).string(message.minRecharge);
        if (message.tagType != null && Object.hasOwnProperty.call(message, "tagType"))
            writer.uint32(/* id 12, wireType 0 =*/96).int32(message.tagType);
        if (message.tagName != null && Object.hasOwnProperty.call(message, "tagName"))
            writer.uint32(/* id 13, wireType 2 =*/106).string(message.tagName);
        if (message.blockConfirm != null && Object.hasOwnProperty.call(message, "blockConfirm"))
            writer.uint32(/* id 14, wireType 2 =*/114).string(message.blockConfirm);
        if (message.cashTotal != null && Object.hasOwnProperty.call(message, "cashTotal"))
            writer.uint32(/* id 15, wireType 2 =*/122).string(message.cashTotal);
        if (message.feeCoin != null && Object.hasOwnProperty.call(message, "feeCoin"))
            writer.uint32(/* id 16, wireType 2 =*/130).string(message.feeCoin);
        if (message.showDecimal != null && Object.hasOwnProperty.call(message, "showDecimal"))
            writer.uint32(/* id 17, wireType 0 =*/136).int32(message.showDecimal);
        if (message.symbol != null && Object.hasOwnProperty.call(message, "symbol"))
            writer.uint32(/* id 18, wireType 2 =*/146).string(message.symbol);
        if (message.alias != null && Object.hasOwnProperty.call(message, "alias"))
            writer.uint32(/* id 19, wireType 2 =*/154).string(message.alias);
        return writer;
    };

    /**
     * Encodes the specified CoinTypeBase message, length delimited. Does not implicitly {@link CoinTypeBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CoinTypeBase
     * @static
     * @param {ICoinTypeBase} message CoinTypeBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CoinTypeBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CoinTypeBase message from the specified reader or buffer.
     * @function decode
     * @memberof CoinTypeBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CoinTypeBase} CoinTypeBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CoinTypeBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CoinTypeBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.id = reader.int32();
                    break;
                }
            case 2: {
                    message.name = reader.string();
                    break;
                }
            case 3: {
                    message.desc = reader.string();
                    break;
                }
            case 4: {
                    message.icon = reader.string();
                    break;
                }
            case 5: {
                    message.letter = reader.string();
                    break;
                }
            case 6: {
                    if (!(message.link && message.link.length))
                        message.link = [];
                    message.link.push($root.CoinLinkBase.decode(reader, reader.uint32()));
                    break;
                }
            case 7: {
                    message.minCash = reader.string();
                    break;
                }
            case 8: {
                    message.maxCash = reader.string();
                    break;
                }
            case 9: {
                    message.isOpenCash = reader.bool();
                    break;
                }
            case 10: {
                    message.isOpenRecharge = reader.bool();
                    break;
                }
            case 11: {
                    message.minRecharge = reader.string();
                    break;
                }
            case 12: {
                    message.tagType = reader.int32();
                    break;
                }
            case 13: {
                    message.tagName = reader.string();
                    break;
                }
            case 14: {
                    message.blockConfirm = reader.string();
                    break;
                }
            case 15: {
                    message.cashTotal = reader.string();
                    break;
                }
            case 16: {
                    message.feeCoin = reader.string();
                    break;
                }
            case 17: {
                    message.showDecimal = reader.int32();
                    break;
                }
            case 18: {
                    message.symbol = reader.string();
                    break;
                }
            case 19: {
                    message.alias = reader.string();
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
     * Decodes a CoinTypeBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CoinTypeBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CoinTypeBase} CoinTypeBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CoinTypeBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CoinTypeBase message.
     * @function verify
     * @memberof CoinTypeBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CoinTypeBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.id != null && message.hasOwnProperty("id"))
            if (!$util.isInteger(message.id))
                return "id: integer expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.desc != null && message.hasOwnProperty("desc"))
            if (!$util.isString(message.desc))
                return "desc: string expected";
        if (message.icon != null && message.hasOwnProperty("icon"))
            if (!$util.isString(message.icon))
                return "icon: string expected";
        if (message.letter != null && message.hasOwnProperty("letter"))
            if (!$util.isString(message.letter))
                return "letter: string expected";
        if (message.link != null && message.hasOwnProperty("link")) {
            if (!Array.isArray(message.link))
                return "link: array expected";
            for (let i = 0; i < message.link.length; ++i) {
                let error = $root.CoinLinkBase.verify(message.link[i]);
                if (error)
                    return "link." + error;
            }
        }
        if (message.minCash != null && message.hasOwnProperty("minCash"))
            if (!$util.isString(message.minCash))
                return "minCash: string expected";
        if (message.maxCash != null && message.hasOwnProperty("maxCash"))
            if (!$util.isString(message.maxCash))
                return "maxCash: string expected";
        if (message.isOpenCash != null && message.hasOwnProperty("isOpenCash"))
            if (typeof message.isOpenCash !== "boolean")
                return "isOpenCash: boolean expected";
        if (message.isOpenRecharge != null && message.hasOwnProperty("isOpenRecharge"))
            if (typeof message.isOpenRecharge !== "boolean")
                return "isOpenRecharge: boolean expected";
        if (message.minRecharge != null && message.hasOwnProperty("minRecharge"))
            if (!$util.isString(message.minRecharge))
                return "minRecharge: string expected";
        if (message.tagType != null && message.hasOwnProperty("tagType"))
            if (!$util.isInteger(message.tagType))
                return "tagType: integer expected";
        if (message.tagName != null && message.hasOwnProperty("tagName"))
            if (!$util.isString(message.tagName))
                return "tagName: string expected";
        if (message.blockConfirm != null && message.hasOwnProperty("blockConfirm"))
            if (!$util.isString(message.blockConfirm))
                return "blockConfirm: string expected";
        if (message.cashTotal != null && message.hasOwnProperty("cashTotal"))
            if (!$util.isString(message.cashTotal))
                return "cashTotal: string expected";
        if (message.feeCoin != null && message.hasOwnProperty("feeCoin"))
            if (!$util.isString(message.feeCoin))
                return "feeCoin: string expected";
        if (message.showDecimal != null && message.hasOwnProperty("showDecimal"))
            if (!$util.isInteger(message.showDecimal))
                return "showDecimal: integer expected";
        if (message.symbol != null && message.hasOwnProperty("symbol"))
            if (!$util.isString(message.symbol))
                return "symbol: string expected";
        if (message.alias != null && message.hasOwnProperty("alias"))
            if (!$util.isString(message.alias))
                return "alias: string expected";
        return null;
    };

    /**
     * Creates a CoinTypeBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CoinTypeBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CoinTypeBase} CoinTypeBase
     */
    CoinTypeBase.fromObject = function fromObject(object) {
        if (object instanceof $root.CoinTypeBase)
            return object;
        let message = new $root.CoinTypeBase();
        if (object.id != null)
            message.id = object.id | 0;
        if (object.name != null)
            message.name = String(object.name);
        if (object.desc != null)
            message.desc = String(object.desc);
        if (object.icon != null)
            message.icon = String(object.icon);
        if (object.letter != null)
            message.letter = String(object.letter);
        if (object.link) {
            if (!Array.isArray(object.link))
                throw TypeError(".CoinTypeBase.link: array expected");
            message.link = [];
            for (let i = 0; i < object.link.length; ++i) {
                if (typeof object.link[i] !== "object")
                    throw TypeError(".CoinTypeBase.link: object expected");
                message.link[i] = $root.CoinLinkBase.fromObject(object.link[i]);
            }
        }
        if (object.minCash != null)
            message.minCash = String(object.minCash);
        if (object.maxCash != null)
            message.maxCash = String(object.maxCash);
        if (object.isOpenCash != null)
            message.isOpenCash = Boolean(object.isOpenCash);
        if (object.isOpenRecharge != null)
            message.isOpenRecharge = Boolean(object.isOpenRecharge);
        if (object.minRecharge != null)
            message.minRecharge = String(object.minRecharge);
        if (object.tagType != null)
            message.tagType = object.tagType | 0;
        if (object.tagName != null)
            message.tagName = String(object.tagName);
        if (object.blockConfirm != null)
            message.blockConfirm = String(object.blockConfirm);
        if (object.cashTotal != null)
            message.cashTotal = String(object.cashTotal);
        if (object.feeCoin != null)
            message.feeCoin = String(object.feeCoin);
        if (object.showDecimal != null)
            message.showDecimal = object.showDecimal | 0;
        if (object.symbol != null)
            message.symbol = String(object.symbol);
        if (object.alias != null)
            message.alias = String(object.alias);
        return message;
    };

    /**
     * Creates a plain object from a CoinTypeBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CoinTypeBase
     * @static
     * @param {CoinTypeBase} message CoinTypeBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CoinTypeBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.arrays || options.defaults)
            object.link = [];
        if (options.defaults) {
            object.id = 0;
            object.name = "";
            object.desc = "";
            object.icon = "";
            object.letter = "";
            object.minCash = "";
            object.maxCash = "";
            object.isOpenCash = false;
            object.isOpenRecharge = false;
            object.minRecharge = "";
            object.tagType = 0;
            object.tagName = "";
            object.blockConfirm = "";
            object.cashTotal = "";
            object.feeCoin = "";
            object.showDecimal = 0;
            object.symbol = "";
            object.alias = "";
        }
        if (message.id != null && message.hasOwnProperty("id"))
            object.id = message.id;
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.desc != null && message.hasOwnProperty("desc"))
            object.desc = message.desc;
        if (message.icon != null && message.hasOwnProperty("icon"))
            object.icon = message.icon;
        if (message.letter != null && message.hasOwnProperty("letter"))
            object.letter = message.letter;
        if (message.link && message.link.length) {
            object.link = [];
            for (let j = 0; j < message.link.length; ++j)
                object.link[j] = $root.CoinLinkBase.toObject(message.link[j], options);
        }
        if (message.minCash != null && message.hasOwnProperty("minCash"))
            object.minCash = message.minCash;
        if (message.maxCash != null && message.hasOwnProperty("maxCash"))
            object.maxCash = message.maxCash;
        if (message.isOpenCash != null && message.hasOwnProperty("isOpenCash"))
            object.isOpenCash = message.isOpenCash;
        if (message.isOpenRecharge != null && message.hasOwnProperty("isOpenRecharge"))
            object.isOpenRecharge = message.isOpenRecharge;
        if (message.minRecharge != null && message.hasOwnProperty("minRecharge"))
            object.minRecharge = message.minRecharge;
        if (message.tagType != null && message.hasOwnProperty("tagType"))
            object.tagType = message.tagType;
        if (message.tagName != null && message.hasOwnProperty("tagName"))
            object.tagName = message.tagName;
        if (message.blockConfirm != null && message.hasOwnProperty("blockConfirm"))
            object.blockConfirm = message.blockConfirm;
        if (message.cashTotal != null && message.hasOwnProperty("cashTotal"))
            object.cashTotal = message.cashTotal;
        if (message.feeCoin != null && message.hasOwnProperty("feeCoin"))
            object.feeCoin = message.feeCoin;
        if (message.showDecimal != null && message.hasOwnProperty("showDecimal"))
            object.showDecimal = message.showDecimal;
        if (message.symbol != null && message.hasOwnProperty("symbol"))
            object.symbol = message.symbol;
        if (message.alias != null && message.hasOwnProperty("alias"))
            object.alias = message.alias;
        return object;
    };

    /**
     * Converts this CoinTypeBase to JSON.
     * @function toJSON
     * @memberof CoinTypeBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CoinTypeBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CoinTypeBase
     * @function getTypeUrl
     * @memberof CoinTypeBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CoinTypeBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CoinTypeBase";
    };

    return CoinTypeBase;
})();

export const NewsCategoryBase = $root.NewsCategoryBase = (() => {

    /**
     * Properties of a NewsCategoryBase.
     * @exports INewsCategoryBase
     * @interface INewsCategoryBase
     * @property {number|null} [categoryId] NewsCategoryBase categoryId
     * @property {string|null} [name] NewsCategoryBase name
     * @property {number|null} [sort] NewsCategoryBase sort
     */

    /**
     * Constructs a new NewsCategoryBase.
     * @exports NewsCategoryBase
     * @classdesc Represents a NewsCategoryBase.
     * @implements INewsCategoryBase
     * @constructor
     * @param {INewsCategoryBase=} [properties] Properties to set
     */
    function NewsCategoryBase(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * NewsCategoryBase categoryId.
     * @member {number} categoryId
     * @memberof NewsCategoryBase
     * @instance
     */
    NewsCategoryBase.prototype.categoryId = 0;

    /**
     * NewsCategoryBase name.
     * @member {string} name
     * @memberof NewsCategoryBase
     * @instance
     */
    NewsCategoryBase.prototype.name = "";

    /**
     * NewsCategoryBase sort.
     * @member {number} sort
     * @memberof NewsCategoryBase
     * @instance
     */
    NewsCategoryBase.prototype.sort = 0;

    /**
     * Creates a new NewsCategoryBase instance using the specified properties.
     * @function create
     * @memberof NewsCategoryBase
     * @static
     * @param {INewsCategoryBase=} [properties] Properties to set
     * @returns {NewsCategoryBase} NewsCategoryBase instance
     */
    NewsCategoryBase.create = function create(properties) {
        return new NewsCategoryBase(properties);
    };

    /**
     * Encodes the specified NewsCategoryBase message. Does not implicitly {@link NewsCategoryBase.verify|verify} messages.
     * @function encode
     * @memberof NewsCategoryBase
     * @static
     * @param {INewsCategoryBase} message NewsCategoryBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NewsCategoryBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.categoryId != null && Object.hasOwnProperty.call(message, "categoryId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.categoryId);
        if (message.name != null && Object.hasOwnProperty.call(message, "name"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.name);
        if (message.sort != null && Object.hasOwnProperty.call(message, "sort"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.sort);
        return writer;
    };

    /**
     * Encodes the specified NewsCategoryBase message, length delimited. Does not implicitly {@link NewsCategoryBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof NewsCategoryBase
     * @static
     * @param {INewsCategoryBase} message NewsCategoryBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NewsCategoryBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a NewsCategoryBase message from the specified reader or buffer.
     * @function decode
     * @memberof NewsCategoryBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {NewsCategoryBase} NewsCategoryBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NewsCategoryBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.NewsCategoryBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.categoryId = reader.int32();
                    break;
                }
            case 2: {
                    message.name = reader.string();
                    break;
                }
            case 3: {
                    message.sort = reader.int32();
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
     * Decodes a NewsCategoryBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof NewsCategoryBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {NewsCategoryBase} NewsCategoryBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NewsCategoryBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a NewsCategoryBase message.
     * @function verify
     * @memberof NewsCategoryBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    NewsCategoryBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.categoryId != null && message.hasOwnProperty("categoryId"))
            if (!$util.isInteger(message.categoryId))
                return "categoryId: integer expected";
        if (message.name != null && message.hasOwnProperty("name"))
            if (!$util.isString(message.name))
                return "name: string expected";
        if (message.sort != null && message.hasOwnProperty("sort"))
            if (!$util.isInteger(message.sort))
                return "sort: integer expected";
        return null;
    };

    /**
     * Creates a NewsCategoryBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof NewsCategoryBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {NewsCategoryBase} NewsCategoryBase
     */
    NewsCategoryBase.fromObject = function fromObject(object) {
        if (object instanceof $root.NewsCategoryBase)
            return object;
        let message = new $root.NewsCategoryBase();
        if (object.categoryId != null)
            message.categoryId = object.categoryId | 0;
        if (object.name != null)
            message.name = String(object.name);
        if (object.sort != null)
            message.sort = object.sort | 0;
        return message;
    };

    /**
     * Creates a plain object from a NewsCategoryBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof NewsCategoryBase
     * @static
     * @param {NewsCategoryBase} message NewsCategoryBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    NewsCategoryBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.categoryId = 0;
            object.name = "";
            object.sort = 0;
        }
        if (message.categoryId != null && message.hasOwnProperty("categoryId"))
            object.categoryId = message.categoryId;
        if (message.name != null && message.hasOwnProperty("name"))
            object.name = message.name;
        if (message.sort != null && message.hasOwnProperty("sort"))
            object.sort = message.sort;
        return object;
    };

    /**
     * Converts this NewsCategoryBase to JSON.
     * @function toJSON
     * @memberof NewsCategoryBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    NewsCategoryBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for NewsCategoryBase
     * @function getTypeUrl
     * @memberof NewsCategoryBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    NewsCategoryBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/NewsCategoryBase";
    };

    return NewsCategoryBase;
})();

export const NewsBase = $root.NewsBase = (() => {

    /**
     * Properties of a NewsBase.
     * @exports INewsBase
     * @interface INewsBase
     * @property {number|Long|null} [newsId] NewsBase newsId
     * @property {string|null} [title] NewsBase title
     * @property {string|null} [pic] NewsBase pic
     * @property {number|Long|null} [time] NewsBase time
     * @property {string|null} [detailLink] NewsBase detailLink
     */

    /**
     * Constructs a new NewsBase.
     * @exports NewsBase
     * @classdesc Represents a NewsBase.
     * @implements INewsBase
     * @constructor
     * @param {INewsBase=} [properties] Properties to set
     */
    function NewsBase(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * NewsBase newsId.
     * @member {number|Long} newsId
     * @memberof NewsBase
     * @instance
     */
    NewsBase.prototype.newsId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * NewsBase title.
     * @member {string} title
     * @memberof NewsBase
     * @instance
     */
    NewsBase.prototype.title = "";

    /**
     * NewsBase pic.
     * @member {string} pic
     * @memberof NewsBase
     * @instance
     */
    NewsBase.prototype.pic = "";

    /**
     * NewsBase time.
     * @member {number|Long} time
     * @memberof NewsBase
     * @instance
     */
    NewsBase.prototype.time = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * NewsBase detailLink.
     * @member {string} detailLink
     * @memberof NewsBase
     * @instance
     */
    NewsBase.prototype.detailLink = "";

    /**
     * Creates a new NewsBase instance using the specified properties.
     * @function create
     * @memberof NewsBase
     * @static
     * @param {INewsBase=} [properties] Properties to set
     * @returns {NewsBase} NewsBase instance
     */
    NewsBase.create = function create(properties) {
        return new NewsBase(properties);
    };

    /**
     * Encodes the specified NewsBase message. Does not implicitly {@link NewsBase.verify|verify} messages.
     * @function encode
     * @memberof NewsBase
     * @static
     * @param {INewsBase} message NewsBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NewsBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.newsId != null && Object.hasOwnProperty.call(message, "newsId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.newsId);
        if (message.title != null && Object.hasOwnProperty.call(message, "title"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.title);
        if (message.pic != null && Object.hasOwnProperty.call(message, "pic"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.pic);
        if (message.time != null && Object.hasOwnProperty.call(message, "time"))
            writer.uint32(/* id 4, wireType 0 =*/32).int64(message.time);
        if (message.detailLink != null && Object.hasOwnProperty.call(message, "detailLink"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.detailLink);
        return writer;
    };

    /**
     * Encodes the specified NewsBase message, length delimited. Does not implicitly {@link NewsBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof NewsBase
     * @static
     * @param {INewsBase} message NewsBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    NewsBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a NewsBase message from the specified reader or buffer.
     * @function decode
     * @memberof NewsBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {NewsBase} NewsBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NewsBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.NewsBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.newsId = reader.int64();
                    break;
                }
            case 2: {
                    message.title = reader.string();
                    break;
                }
            case 3: {
                    message.pic = reader.string();
                    break;
                }
            case 4: {
                    message.time = reader.int64();
                    break;
                }
            case 5: {
                    message.detailLink = reader.string();
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
     * Decodes a NewsBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof NewsBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {NewsBase} NewsBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    NewsBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a NewsBase message.
     * @function verify
     * @memberof NewsBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    NewsBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.newsId != null && message.hasOwnProperty("newsId"))
            if (!$util.isInteger(message.newsId) && !(message.newsId && $util.isInteger(message.newsId.low) && $util.isInteger(message.newsId.high)))
                return "newsId: integer|Long expected";
        if (message.title != null && message.hasOwnProperty("title"))
            if (!$util.isString(message.title))
                return "title: string expected";
        if (message.pic != null && message.hasOwnProperty("pic"))
            if (!$util.isString(message.pic))
                return "pic: string expected";
        if (message.time != null && message.hasOwnProperty("time"))
            if (!$util.isInteger(message.time) && !(message.time && $util.isInteger(message.time.low) && $util.isInteger(message.time.high)))
                return "time: integer|Long expected";
        if (message.detailLink != null && message.hasOwnProperty("detailLink"))
            if (!$util.isString(message.detailLink))
                return "detailLink: string expected";
        return null;
    };

    /**
     * Creates a NewsBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof NewsBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {NewsBase} NewsBase
     */
    NewsBase.fromObject = function fromObject(object) {
        if (object instanceof $root.NewsBase)
            return object;
        let message = new $root.NewsBase();
        if (object.newsId != null)
            if ($util.Long)
                (message.newsId = $util.Long.fromValue(object.newsId)).unsigned = false;
            else if (typeof object.newsId === "string")
                message.newsId = parseInt(object.newsId, 10);
            else if (typeof object.newsId === "number")
                message.newsId = object.newsId;
            else if (typeof object.newsId === "object")
                message.newsId = new $util.LongBits(object.newsId.low >>> 0, object.newsId.high >>> 0).toNumber();
        if (object.title != null)
            message.title = String(object.title);
        if (object.pic != null)
            message.pic = String(object.pic);
        if (object.time != null)
            if ($util.Long)
                (message.time = $util.Long.fromValue(object.time)).unsigned = false;
            else if (typeof object.time === "string")
                message.time = parseInt(object.time, 10);
            else if (typeof object.time === "number")
                message.time = object.time;
            else if (typeof object.time === "object")
                message.time = new $util.LongBits(object.time.low >>> 0, object.time.high >>> 0).toNumber();
        if (object.detailLink != null)
            message.detailLink = String(object.detailLink);
        return message;
    };

    /**
     * Creates a plain object from a NewsBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof NewsBase
     * @static
     * @param {NewsBase} message NewsBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    NewsBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.newsId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.newsId = options.longs === String ? "0" : 0;
            object.title = "";
            object.pic = "";
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.time = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.time = options.longs === String ? "0" : 0;
            object.detailLink = "";
        }
        if (message.newsId != null && message.hasOwnProperty("newsId"))
            if (typeof message.newsId === "number")
                object.newsId = options.longs === String ? String(message.newsId) : message.newsId;
            else
                object.newsId = options.longs === String ? $util.Long.prototype.toString.call(message.newsId) : options.longs === Number ? new $util.LongBits(message.newsId.low >>> 0, message.newsId.high >>> 0).toNumber() : message.newsId;
        if (message.title != null && message.hasOwnProperty("title"))
            object.title = message.title;
        if (message.pic != null && message.hasOwnProperty("pic"))
            object.pic = message.pic;
        if (message.time != null && message.hasOwnProperty("time"))
            if (typeof message.time === "number")
                object.time = options.longs === String ? String(message.time) : message.time;
            else
                object.time = options.longs === String ? $util.Long.prototype.toString.call(message.time) : options.longs === Number ? new $util.LongBits(message.time.low >>> 0, message.time.high >>> 0).toNumber() : message.time;
        if (message.detailLink != null && message.hasOwnProperty("detailLink"))
            object.detailLink = message.detailLink;
        return object;
    };

    /**
     * Converts this NewsBase to JSON.
     * @function toJSON
     * @memberof NewsBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    NewsBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for NewsBase
     * @function getTypeUrl
     * @memberof NewsBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    NewsBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/NewsBase";
    };

    return NewsBase;
})();

export const PaymentBase = $root.PaymentBase = (() => {

    /**
     * Properties of a PaymentBase.
     * @exports IPaymentBase
     * @interface IPaymentBase
     * @property {number|null} [paymentId] PaymentBase paymentId
     * @property {number|null} [paymentType] PaymentBase paymentType
     * @property {string|null} [accountName] PaymentBase accountName
     * @property {string|null} [cardNo] PaymentBase cardNo
     * @property {string|null} [bankName] PaymentBase bankName
     * @property {string|null} [subBankName] PaymentBase subBankName
     */

    /**
     * Constructs a new PaymentBase.
     * @exports PaymentBase
     * @classdesc Represents a PaymentBase.
     * @implements IPaymentBase
     * @constructor
     * @param {IPaymentBase=} [properties] Properties to set
     */
    function PaymentBase(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * PaymentBase paymentId.
     * @member {number} paymentId
     * @memberof PaymentBase
     * @instance
     */
    PaymentBase.prototype.paymentId = 0;

    /**
     * PaymentBase paymentType.
     * @member {number} paymentType
     * @memberof PaymentBase
     * @instance
     */
    PaymentBase.prototype.paymentType = 0;

    /**
     * PaymentBase accountName.
     * @member {string} accountName
     * @memberof PaymentBase
     * @instance
     */
    PaymentBase.prototype.accountName = "";

    /**
     * PaymentBase cardNo.
     * @member {string} cardNo
     * @memberof PaymentBase
     * @instance
     */
    PaymentBase.prototype.cardNo = "";

    /**
     * PaymentBase bankName.
     * @member {string} bankName
     * @memberof PaymentBase
     * @instance
     */
    PaymentBase.prototype.bankName = "";

    /**
     * PaymentBase subBankName.
     * @member {string} subBankName
     * @memberof PaymentBase
     * @instance
     */
    PaymentBase.prototype.subBankName = "";

    /**
     * Creates a new PaymentBase instance using the specified properties.
     * @function create
     * @memberof PaymentBase
     * @static
     * @param {IPaymentBase=} [properties] Properties to set
     * @returns {PaymentBase} PaymentBase instance
     */
    PaymentBase.create = function create(properties) {
        return new PaymentBase(properties);
    };

    /**
     * Encodes the specified PaymentBase message. Does not implicitly {@link PaymentBase.verify|verify} messages.
     * @function encode
     * @memberof PaymentBase
     * @static
     * @param {IPaymentBase} message PaymentBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PaymentBase.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.paymentId != null && Object.hasOwnProperty.call(message, "paymentId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.paymentId);
        if (message.paymentType != null && Object.hasOwnProperty.call(message, "paymentType"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.paymentType);
        if (message.accountName != null && Object.hasOwnProperty.call(message, "accountName"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.accountName);
        if (message.cardNo != null && Object.hasOwnProperty.call(message, "cardNo"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.cardNo);
        if (message.bankName != null && Object.hasOwnProperty.call(message, "bankName"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.bankName);
        if (message.subBankName != null && Object.hasOwnProperty.call(message, "subBankName"))
            writer.uint32(/* id 6, wireType 2 =*/50).string(message.subBankName);
        return writer;
    };

    /**
     * Encodes the specified PaymentBase message, length delimited. Does not implicitly {@link PaymentBase.verify|verify} messages.
     * @function encodeDelimited
     * @memberof PaymentBase
     * @static
     * @param {IPaymentBase} message PaymentBase message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PaymentBase.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a PaymentBase message from the specified reader or buffer.
     * @function decode
     * @memberof PaymentBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {PaymentBase} PaymentBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PaymentBase.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.PaymentBase();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.paymentId = reader.int32();
                    break;
                }
            case 2: {
                    message.paymentType = reader.int32();
                    break;
                }
            case 3: {
                    message.accountName = reader.string();
                    break;
                }
            case 4: {
                    message.cardNo = reader.string();
                    break;
                }
            case 5: {
                    message.bankName = reader.string();
                    break;
                }
            case 6: {
                    message.subBankName = reader.string();
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
     * Decodes a PaymentBase message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof PaymentBase
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {PaymentBase} PaymentBase
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PaymentBase.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a PaymentBase message.
     * @function verify
     * @memberof PaymentBase
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PaymentBase.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.paymentId != null && message.hasOwnProperty("paymentId"))
            if (!$util.isInteger(message.paymentId))
                return "paymentId: integer expected";
        if (message.paymentType != null && message.hasOwnProperty("paymentType"))
            if (!$util.isInteger(message.paymentType))
                return "paymentType: integer expected";
        if (message.accountName != null && message.hasOwnProperty("accountName"))
            if (!$util.isString(message.accountName))
                return "accountName: string expected";
        if (message.cardNo != null && message.hasOwnProperty("cardNo"))
            if (!$util.isString(message.cardNo))
                return "cardNo: string expected";
        if (message.bankName != null && message.hasOwnProperty("bankName"))
            if (!$util.isString(message.bankName))
                return "bankName: string expected";
        if (message.subBankName != null && message.hasOwnProperty("subBankName"))
            if (!$util.isString(message.subBankName))
                return "subBankName: string expected";
        return null;
    };

    /**
     * Creates a PaymentBase message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof PaymentBase
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {PaymentBase} PaymentBase
     */
    PaymentBase.fromObject = function fromObject(object) {
        if (object instanceof $root.PaymentBase)
            return object;
        let message = new $root.PaymentBase();
        if (object.paymentId != null)
            message.paymentId = object.paymentId | 0;
        if (object.paymentType != null)
            message.paymentType = object.paymentType | 0;
        if (object.accountName != null)
            message.accountName = String(object.accountName);
        if (object.cardNo != null)
            message.cardNo = String(object.cardNo);
        if (object.bankName != null)
            message.bankName = String(object.bankName);
        if (object.subBankName != null)
            message.subBankName = String(object.subBankName);
        return message;
    };

    /**
     * Creates a plain object from a PaymentBase message. Also converts values to other types if specified.
     * @function toObject
     * @memberof PaymentBase
     * @static
     * @param {PaymentBase} message PaymentBase
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PaymentBase.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.paymentId = 0;
            object.paymentType = 0;
            object.accountName = "";
            object.cardNo = "";
            object.bankName = "";
            object.subBankName = "";
        }
        if (message.paymentId != null && message.hasOwnProperty("paymentId"))
            object.paymentId = message.paymentId;
        if (message.paymentType != null && message.hasOwnProperty("paymentType"))
            object.paymentType = message.paymentType;
        if (message.accountName != null && message.hasOwnProperty("accountName"))
            object.accountName = message.accountName;
        if (message.cardNo != null && message.hasOwnProperty("cardNo"))
            object.cardNo = message.cardNo;
        if (message.bankName != null && message.hasOwnProperty("bankName"))
            object.bankName = message.bankName;
        if (message.subBankName != null && message.hasOwnProperty("subBankName"))
            object.subBankName = message.subBankName;
        return object;
    };

    /**
     * Converts this PaymentBase to JSON.
     * @function toJSON
     * @memberof PaymentBase
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PaymentBase.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for PaymentBase
     * @function getTypeUrl
     * @memberof PaymentBase
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    PaymentBase.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/PaymentBase";
    };

    return PaymentBase;
})();

export const PaymentBasics = $root.PaymentBasics = (() => {

    /**
     * Properties of a PaymentBasics.
     * @exports IPaymentBasics
     * @interface IPaymentBasics
     * @property {number|Long|null} [paymentId] PaymentBasics paymentId
     * @property {number|null} [paymentType] PaymentBasics paymentType
     */

    /**
     * Constructs a new PaymentBasics.
     * @exports PaymentBasics
     * @classdesc Represents a PaymentBasics.
     * @implements IPaymentBasics
     * @constructor
     * @param {IPaymentBasics=} [properties] Properties to set
     */
    function PaymentBasics(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * PaymentBasics paymentId.
     * @member {number|Long} paymentId
     * @memberof PaymentBasics
     * @instance
     */
    PaymentBasics.prototype.paymentId = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

    /**
     * PaymentBasics paymentType.
     * @member {number} paymentType
     * @memberof PaymentBasics
     * @instance
     */
    PaymentBasics.prototype.paymentType = 0;

    /**
     * Creates a new PaymentBasics instance using the specified properties.
     * @function create
     * @memberof PaymentBasics
     * @static
     * @param {IPaymentBasics=} [properties] Properties to set
     * @returns {PaymentBasics} PaymentBasics instance
     */
    PaymentBasics.create = function create(properties) {
        return new PaymentBasics(properties);
    };

    /**
     * Encodes the specified PaymentBasics message. Does not implicitly {@link PaymentBasics.verify|verify} messages.
     * @function encode
     * @memberof PaymentBasics
     * @static
     * @param {IPaymentBasics} message PaymentBasics message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PaymentBasics.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.paymentId != null && Object.hasOwnProperty.call(message, "paymentId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int64(message.paymentId);
        if (message.paymentType != null && Object.hasOwnProperty.call(message, "paymentType"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.paymentType);
        return writer;
    };

    /**
     * Encodes the specified PaymentBasics message, length delimited. Does not implicitly {@link PaymentBasics.verify|verify} messages.
     * @function encodeDelimited
     * @memberof PaymentBasics
     * @static
     * @param {IPaymentBasics} message PaymentBasics message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PaymentBasics.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a PaymentBasics message from the specified reader or buffer.
     * @function decode
     * @memberof PaymentBasics
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {PaymentBasics} PaymentBasics
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PaymentBasics.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.PaymentBasics();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.paymentId = reader.int64();
                    break;
                }
            case 2: {
                    message.paymentType = reader.int32();
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
     * Decodes a PaymentBasics message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof PaymentBasics
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {PaymentBasics} PaymentBasics
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PaymentBasics.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a PaymentBasics message.
     * @function verify
     * @memberof PaymentBasics
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PaymentBasics.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.paymentId != null && message.hasOwnProperty("paymentId"))
            if (!$util.isInteger(message.paymentId) && !(message.paymentId && $util.isInteger(message.paymentId.low) && $util.isInteger(message.paymentId.high)))
                return "paymentId: integer|Long expected";
        if (message.paymentType != null && message.hasOwnProperty("paymentType"))
            if (!$util.isInteger(message.paymentType))
                return "paymentType: integer expected";
        return null;
    };

    /**
     * Creates a PaymentBasics message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof PaymentBasics
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {PaymentBasics} PaymentBasics
     */
    PaymentBasics.fromObject = function fromObject(object) {
        if (object instanceof $root.PaymentBasics)
            return object;
        let message = new $root.PaymentBasics();
        if (object.paymentId != null)
            if ($util.Long)
                (message.paymentId = $util.Long.fromValue(object.paymentId)).unsigned = false;
            else if (typeof object.paymentId === "string")
                message.paymentId = parseInt(object.paymentId, 10);
            else if (typeof object.paymentId === "number")
                message.paymentId = object.paymentId;
            else if (typeof object.paymentId === "object")
                message.paymentId = new $util.LongBits(object.paymentId.low >>> 0, object.paymentId.high >>> 0).toNumber();
        if (object.paymentType != null)
            message.paymentType = object.paymentType | 0;
        return message;
    };

    /**
     * Creates a plain object from a PaymentBasics message. Also converts values to other types if specified.
     * @function toObject
     * @memberof PaymentBasics
     * @static
     * @param {PaymentBasics} message PaymentBasics
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PaymentBasics.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            if ($util.Long) {
                let long = new $util.Long(0, 0, false);
                object.paymentId = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
            } else
                object.paymentId = options.longs === String ? "0" : 0;
            object.paymentType = 0;
        }
        if (message.paymentId != null && message.hasOwnProperty("paymentId"))
            if (typeof message.paymentId === "number")
                object.paymentId = options.longs === String ? String(message.paymentId) : message.paymentId;
            else
                object.paymentId = options.longs === String ? $util.Long.prototype.toString.call(message.paymentId) : options.longs === Number ? new $util.LongBits(message.paymentId.low >>> 0, message.paymentId.high >>> 0).toNumber() : message.paymentId;
        if (message.paymentType != null && message.hasOwnProperty("paymentType"))
            object.paymentType = message.paymentType;
        return object;
    };

    /**
     * Converts this PaymentBasics to JSON.
     * @function toJSON
     * @memberof PaymentBasics
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PaymentBasics.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for PaymentBasics
     * @function getTypeUrl
     * @memberof PaymentBasics
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    PaymentBasics.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/PaymentBasics";
    };

    return PaymentBasics;
})();

export const TranslationInfo = $root.TranslationInfo = (() => {

    /**
     * Properties of a TranslationInfo.
     * @exports ITranslationInfo
     * @interface ITranslationInfo
     * @property {number|null} [autoTranslateStatus] TranslationInfo autoTranslateStatus
     * @property {number|null} [receiveLanguage] TranslationInfo receiveLanguage
     * @property {number|null} [sendLanguage] TranslationInfo sendLanguage
     * @property {string|null} [key] TranslationInfo key
     * @property {string|null} [region] TranslationInfo region
     */

    /**
     * Constructs a new TranslationInfo.
     * @exports TranslationInfo
     * @classdesc Represents a TranslationInfo.
     * @implements ITranslationInfo
     * @constructor
     * @param {ITranslationInfo=} [properties] Properties to set
     */
    function TranslationInfo(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * TranslationInfo autoTranslateStatus.
     * @member {number} autoTranslateStatus
     * @memberof TranslationInfo
     * @instance
     */
    TranslationInfo.prototype.autoTranslateStatus = 0;

    /**
     * TranslationInfo receiveLanguage.
     * @member {number} receiveLanguage
     * @memberof TranslationInfo
     * @instance
     */
    TranslationInfo.prototype.receiveLanguage = 0;

    /**
     * TranslationInfo sendLanguage.
     * @member {number} sendLanguage
     * @memberof TranslationInfo
     * @instance
     */
    TranslationInfo.prototype.sendLanguage = 0;

    /**
     * TranslationInfo key.
     * @member {string} key
     * @memberof TranslationInfo
     * @instance
     */
    TranslationInfo.prototype.key = "";

    /**
     * TranslationInfo region.
     * @member {string} region
     * @memberof TranslationInfo
     * @instance
     */
    TranslationInfo.prototype.region = "";

    /**
     * Creates a new TranslationInfo instance using the specified properties.
     * @function create
     * @memberof TranslationInfo
     * @static
     * @param {ITranslationInfo=} [properties] Properties to set
     * @returns {TranslationInfo} TranslationInfo instance
     */
    TranslationInfo.create = function create(properties) {
        return new TranslationInfo(properties);
    };

    /**
     * Encodes the specified TranslationInfo message. Does not implicitly {@link TranslationInfo.verify|verify} messages.
     * @function encode
     * @memberof TranslationInfo
     * @static
     * @param {ITranslationInfo} message TranslationInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TranslationInfo.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.autoTranslateStatus != null && Object.hasOwnProperty.call(message, "autoTranslateStatus"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.autoTranslateStatus);
        if (message.receiveLanguage != null && Object.hasOwnProperty.call(message, "receiveLanguage"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.receiveLanguage);
        if (message.sendLanguage != null && Object.hasOwnProperty.call(message, "sendLanguage"))
            writer.uint32(/* id 4, wireType 0 =*/32).int32(message.sendLanguage);
        if (message.key != null && Object.hasOwnProperty.call(message, "key"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.key);
        if (message.region != null && Object.hasOwnProperty.call(message, "region"))
            writer.uint32(/* id 6, wireType 2 =*/50).string(message.region);
        return writer;
    };

    /**
     * Encodes the specified TranslationInfo message, length delimited. Does not implicitly {@link TranslationInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof TranslationInfo
     * @static
     * @param {ITranslationInfo} message TranslationInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    TranslationInfo.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a TranslationInfo message from the specified reader or buffer.
     * @function decode
     * @memberof TranslationInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {TranslationInfo} TranslationInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TranslationInfo.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.TranslationInfo();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 2: {
                    message.autoTranslateStatus = reader.int32();
                    break;
                }
            case 3: {
                    message.receiveLanguage = reader.int32();
                    break;
                }
            case 4: {
                    message.sendLanguage = reader.int32();
                    break;
                }
            case 5: {
                    message.key = reader.string();
                    break;
                }
            case 6: {
                    message.region = reader.string();
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
     * Decodes a TranslationInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof TranslationInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {TranslationInfo} TranslationInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    TranslationInfo.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a TranslationInfo message.
     * @function verify
     * @memberof TranslationInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    TranslationInfo.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.autoTranslateStatus != null && message.hasOwnProperty("autoTranslateStatus"))
            if (!$util.isInteger(message.autoTranslateStatus))
                return "autoTranslateStatus: integer expected";
        if (message.receiveLanguage != null && message.hasOwnProperty("receiveLanguage"))
            if (!$util.isInteger(message.receiveLanguage))
                return "receiveLanguage: integer expected";
        if (message.sendLanguage != null && message.hasOwnProperty("sendLanguage"))
            if (!$util.isInteger(message.sendLanguage))
                return "sendLanguage: integer expected";
        if (message.key != null && message.hasOwnProperty("key"))
            if (!$util.isString(message.key))
                return "key: string expected";
        if (message.region != null && message.hasOwnProperty("region"))
            if (!$util.isString(message.region))
                return "region: string expected";
        return null;
    };

    /**
     * Creates a TranslationInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof TranslationInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {TranslationInfo} TranslationInfo
     */
    TranslationInfo.fromObject = function fromObject(object) {
        if (object instanceof $root.TranslationInfo)
            return object;
        let message = new $root.TranslationInfo();
        if (object.autoTranslateStatus != null)
            message.autoTranslateStatus = object.autoTranslateStatus | 0;
        if (object.receiveLanguage != null)
            message.receiveLanguage = object.receiveLanguage | 0;
        if (object.sendLanguage != null)
            message.sendLanguage = object.sendLanguage | 0;
        if (object.key != null)
            message.key = String(object.key);
        if (object.region != null)
            message.region = String(object.region);
        return message;
    };

    /**
     * Creates a plain object from a TranslationInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof TranslationInfo
     * @static
     * @param {TranslationInfo} message TranslationInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    TranslationInfo.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.autoTranslateStatus = 0;
            object.receiveLanguage = 0;
            object.sendLanguage = 0;
            object.key = "";
            object.region = "";
        }
        if (message.autoTranslateStatus != null && message.hasOwnProperty("autoTranslateStatus"))
            object.autoTranslateStatus = message.autoTranslateStatus;
        if (message.receiveLanguage != null && message.hasOwnProperty("receiveLanguage"))
            object.receiveLanguage = message.receiveLanguage;
        if (message.sendLanguage != null && message.hasOwnProperty("sendLanguage"))
            object.sendLanguage = message.sendLanguage;
        if (message.key != null && message.hasOwnProperty("key"))
            object.key = message.key;
        if (message.region != null && message.hasOwnProperty("region"))
            object.region = message.region;
        return object;
    };

    /**
     * Converts this TranslationInfo to JSON.
     * @function toJSON
     * @memberof TranslationInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    TranslationInfo.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for TranslationInfo
     * @function getTypeUrl
     * @memberof TranslationInfo
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    TranslationInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/TranslationInfo";
    };

    return TranslationInfo;
})();

export const BotGameInfo = $root.BotGameInfo = (() => {

    /**
     * Properties of a BotGameInfo.
     * @exports IBotGameInfo
     * @interface IBotGameInfo
     * @property {string|null} [gameId] BotGameInfo gameId
     * @property {string|null} [gameName] BotGameInfo gameName
     */

    /**
     * Constructs a new BotGameInfo.
     * @exports BotGameInfo
     * @classdesc Represents a BotGameInfo.
     * @implements IBotGameInfo
     * @constructor
     * @param {IBotGameInfo=} [properties] Properties to set
     */
    function BotGameInfo(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * BotGameInfo gameId.
     * @member {string} gameId
     * @memberof BotGameInfo
     * @instance
     */
    BotGameInfo.prototype.gameId = "";

    /**
     * BotGameInfo gameName.
     * @member {string} gameName
     * @memberof BotGameInfo
     * @instance
     */
    BotGameInfo.prototype.gameName = "";

    /**
     * Creates a new BotGameInfo instance using the specified properties.
     * @function create
     * @memberof BotGameInfo
     * @static
     * @param {IBotGameInfo=} [properties] Properties to set
     * @returns {BotGameInfo} BotGameInfo instance
     */
    BotGameInfo.create = function create(properties) {
        return new BotGameInfo(properties);
    };

    /**
     * Encodes the specified BotGameInfo message. Does not implicitly {@link BotGameInfo.verify|verify} messages.
     * @function encode
     * @memberof BotGameInfo
     * @static
     * @param {IBotGameInfo} message BotGameInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    BotGameInfo.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.gameId != null && Object.hasOwnProperty.call(message, "gameId"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.gameId);
        if (message.gameName != null && Object.hasOwnProperty.call(message, "gameName"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.gameName);
        return writer;
    };

    /**
     * Encodes the specified BotGameInfo message, length delimited. Does not implicitly {@link BotGameInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof BotGameInfo
     * @static
     * @param {IBotGameInfo} message BotGameInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    BotGameInfo.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a BotGameInfo message from the specified reader or buffer.
     * @function decode
     * @memberof BotGameInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {BotGameInfo} BotGameInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    BotGameInfo.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.BotGameInfo();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.gameId = reader.string();
                    break;
                }
            case 2: {
                    message.gameName = reader.string();
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
     * Decodes a BotGameInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof BotGameInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {BotGameInfo} BotGameInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    BotGameInfo.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a BotGameInfo message.
     * @function verify
     * @memberof BotGameInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    BotGameInfo.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.gameId != null && message.hasOwnProperty("gameId"))
            if (!$util.isString(message.gameId))
                return "gameId: string expected";
        if (message.gameName != null && message.hasOwnProperty("gameName"))
            if (!$util.isString(message.gameName))
                return "gameName: string expected";
        return null;
    };

    /**
     * Creates a BotGameInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof BotGameInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {BotGameInfo} BotGameInfo
     */
    BotGameInfo.fromObject = function fromObject(object) {
        if (object instanceof $root.BotGameInfo)
            return object;
        let message = new $root.BotGameInfo();
        if (object.gameId != null)
            message.gameId = String(object.gameId);
        if (object.gameName != null)
            message.gameName = String(object.gameName);
        return message;
    };

    /**
     * Creates a plain object from a BotGameInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof BotGameInfo
     * @static
     * @param {BotGameInfo} message BotGameInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    BotGameInfo.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.gameId = "";
            object.gameName = "";
        }
        if (message.gameId != null && message.hasOwnProperty("gameId"))
            object.gameId = message.gameId;
        if (message.gameName != null && message.hasOwnProperty("gameName"))
            object.gameName = message.gameName;
        return object;
    };

    /**
     * Converts this BotGameInfo to JSON.
     * @function toJSON
     * @memberof BotGameInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    BotGameInfo.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for BotGameInfo
     * @function getTypeUrl
     * @memberof BotGameInfo
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    BotGameInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/BotGameInfo";
    };

    return BotGameInfo;
})();

export const BotAgentInfo = $root.BotAgentInfo = (() => {

    /**
     * Properties of a BotAgentInfo.
     * @exports IBotAgentInfo
     * @interface IBotAgentInfo
     * @property {number|null} [agentId] BotAgentInfo agentId
     * @property {string|null} [agentName] BotAgentInfo agentName
     */

    /**
     * Constructs a new BotAgentInfo.
     * @exports BotAgentInfo
     * @classdesc Represents a BotAgentInfo.
     * @implements IBotAgentInfo
     * @constructor
     * @param {IBotAgentInfo=} [properties] Properties to set
     */
    function BotAgentInfo(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * BotAgentInfo agentId.
     * @member {number} agentId
     * @memberof BotAgentInfo
     * @instance
     */
    BotAgentInfo.prototype.agentId = 0;

    /**
     * BotAgentInfo agentName.
     * @member {string} agentName
     * @memberof BotAgentInfo
     * @instance
     */
    BotAgentInfo.prototype.agentName = "";

    /**
     * Creates a new BotAgentInfo instance using the specified properties.
     * @function create
     * @memberof BotAgentInfo
     * @static
     * @param {IBotAgentInfo=} [properties] Properties to set
     * @returns {BotAgentInfo} BotAgentInfo instance
     */
    BotAgentInfo.create = function create(properties) {
        return new BotAgentInfo(properties);
    };

    /**
     * Encodes the specified BotAgentInfo message. Does not implicitly {@link BotAgentInfo.verify|verify} messages.
     * @function encode
     * @memberof BotAgentInfo
     * @static
     * @param {IBotAgentInfo} message BotAgentInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    BotAgentInfo.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.agentId != null && Object.hasOwnProperty.call(message, "agentId"))
            writer.uint32(/* id 1, wireType 0 =*/8).int32(message.agentId);
        if (message.agentName != null && Object.hasOwnProperty.call(message, "agentName"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.agentName);
        return writer;
    };

    /**
     * Encodes the specified BotAgentInfo message, length delimited. Does not implicitly {@link BotAgentInfo.verify|verify} messages.
     * @function encodeDelimited
     * @memberof BotAgentInfo
     * @static
     * @param {IBotAgentInfo} message BotAgentInfo message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    BotAgentInfo.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a BotAgentInfo message from the specified reader or buffer.
     * @function decode
     * @memberof BotAgentInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {BotAgentInfo} BotAgentInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    BotAgentInfo.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.BotAgentInfo();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.agentId = reader.int32();
                    break;
                }
            case 2: {
                    message.agentName = reader.string();
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
     * Decodes a BotAgentInfo message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof BotAgentInfo
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {BotAgentInfo} BotAgentInfo
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    BotAgentInfo.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a BotAgentInfo message.
     * @function verify
     * @memberof BotAgentInfo
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    BotAgentInfo.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.agentId != null && message.hasOwnProperty("agentId"))
            if (!$util.isInteger(message.agentId))
                return "agentId: integer expected";
        if (message.agentName != null && message.hasOwnProperty("agentName"))
            if (!$util.isString(message.agentName))
                return "agentName: string expected";
        return null;
    };

    /**
     * Creates a BotAgentInfo message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof BotAgentInfo
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {BotAgentInfo} BotAgentInfo
     */
    BotAgentInfo.fromObject = function fromObject(object) {
        if (object instanceof $root.BotAgentInfo)
            return object;
        let message = new $root.BotAgentInfo();
        if (object.agentId != null)
            message.agentId = object.agentId | 0;
        if (object.agentName != null)
            message.agentName = String(object.agentName);
        return message;
    };

    /**
     * Creates a plain object from a BotAgentInfo message. Also converts values to other types if specified.
     * @function toObject
     * @memberof BotAgentInfo
     * @static
     * @param {BotAgentInfo} message BotAgentInfo
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    BotAgentInfo.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.agentId = 0;
            object.agentName = "";
        }
        if (message.agentId != null && message.hasOwnProperty("agentId"))
            object.agentId = message.agentId;
        if (message.agentName != null && message.hasOwnProperty("agentName"))
            object.agentName = message.agentName;
        return object;
    };

    /**
     * Converts this BotAgentInfo to JSON.
     * @function toJSON
     * @memberof BotAgentInfo
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    BotAgentInfo.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for BotAgentInfo
     * @function getTypeUrl
     * @memberof BotAgentInfo
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    BotAgentInfo.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/BotAgentInfo";
    };

    return BotAgentInfo;
})();

export const AwsConfig = $root.AwsConfig = (() => {

    /**
     * Properties of an AwsConfig.
     * @exports IAwsConfig
     * @interface IAwsConfig
     * @property {string|null} [accessKey] AwsConfig accessKey
     * @property {string|null} [secretKey] AwsConfig secretKey
     * @property {string|null} [regionName] AwsConfig regionName
     * @property {string|null} [sessionId] AwsConfig sessionId
     */

    /**
     * Constructs a new AwsConfig.
     * @exports AwsConfig
     * @classdesc Represents an AwsConfig.
     * @implements IAwsConfig
     * @constructor
     * @param {IAwsConfig=} [properties] Properties to set
     */
    function AwsConfig(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * AwsConfig accessKey.
     * @member {string} accessKey
     * @memberof AwsConfig
     * @instance
     */
    AwsConfig.prototype.accessKey = "";

    /**
     * AwsConfig secretKey.
     * @member {string} secretKey
     * @memberof AwsConfig
     * @instance
     */
    AwsConfig.prototype.secretKey = "";

    /**
     * AwsConfig regionName.
     * @member {string} regionName
     * @memberof AwsConfig
     * @instance
     */
    AwsConfig.prototype.regionName = "";

    /**
     * AwsConfig sessionId.
     * @member {string} sessionId
     * @memberof AwsConfig
     * @instance
     */
    AwsConfig.prototype.sessionId = "";

    /**
     * Creates a new AwsConfig instance using the specified properties.
     * @function create
     * @memberof AwsConfig
     * @static
     * @param {IAwsConfig=} [properties] Properties to set
     * @returns {AwsConfig} AwsConfig instance
     */
    AwsConfig.create = function create(properties) {
        return new AwsConfig(properties);
    };

    /**
     * Encodes the specified AwsConfig message. Does not implicitly {@link AwsConfig.verify|verify} messages.
     * @function encode
     * @memberof AwsConfig
     * @static
     * @param {IAwsConfig} message AwsConfig message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    AwsConfig.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.accessKey != null && Object.hasOwnProperty.call(message, "accessKey"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.accessKey);
        if (message.secretKey != null && Object.hasOwnProperty.call(message, "secretKey"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.secretKey);
        if (message.regionName != null && Object.hasOwnProperty.call(message, "regionName"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.regionName);
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.sessionId);
        return writer;
    };

    /**
     * Encodes the specified AwsConfig message, length delimited. Does not implicitly {@link AwsConfig.verify|verify} messages.
     * @function encodeDelimited
     * @memberof AwsConfig
     * @static
     * @param {IAwsConfig} message AwsConfig message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    AwsConfig.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes an AwsConfig message from the specified reader or buffer.
     * @function decode
     * @memberof AwsConfig
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {AwsConfig} AwsConfig
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    AwsConfig.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.AwsConfig();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 2: {
                    message.accessKey = reader.string();
                    break;
                }
            case 3: {
                    message.secretKey = reader.string();
                    break;
                }
            case 4: {
                    message.regionName = reader.string();
                    break;
                }
            case 5: {
                    message.sessionId = reader.string();
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
     * Decodes an AwsConfig message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof AwsConfig
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {AwsConfig} AwsConfig
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    AwsConfig.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies an AwsConfig message.
     * @function verify
     * @memberof AwsConfig
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    AwsConfig.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.accessKey != null && message.hasOwnProperty("accessKey"))
            if (!$util.isString(message.accessKey))
                return "accessKey: string expected";
        if (message.secretKey != null && message.hasOwnProperty("secretKey"))
            if (!$util.isString(message.secretKey))
                return "secretKey: string expected";
        if (message.regionName != null && message.hasOwnProperty("regionName"))
            if (!$util.isString(message.regionName))
                return "regionName: string expected";
        if (message.sessionId != null && message.hasOwnProperty("sessionId"))
            if (!$util.isString(message.sessionId))
                return "sessionId: string expected";
        return null;
    };

    /**
     * Creates an AwsConfig message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof AwsConfig
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {AwsConfig} AwsConfig
     */
    AwsConfig.fromObject = function fromObject(object) {
        if (object instanceof $root.AwsConfig)
            return object;
        let message = new $root.AwsConfig();
        if (object.accessKey != null)
            message.accessKey = String(object.accessKey);
        if (object.secretKey != null)
            message.secretKey = String(object.secretKey);
        if (object.regionName != null)
            message.regionName = String(object.regionName);
        if (object.sessionId != null)
            message.sessionId = String(object.sessionId);
        return message;
    };

    /**
     * Creates a plain object from an AwsConfig message. Also converts values to other types if specified.
     * @function toObject
     * @memberof AwsConfig
     * @static
     * @param {AwsConfig} message AwsConfig
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    AwsConfig.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.accessKey = "";
            object.secretKey = "";
            object.regionName = "";
            object.sessionId = "";
        }
        if (message.accessKey != null && message.hasOwnProperty("accessKey"))
            object.accessKey = message.accessKey;
        if (message.secretKey != null && message.hasOwnProperty("secretKey"))
            object.secretKey = message.secretKey;
        if (message.regionName != null && message.hasOwnProperty("regionName"))
            object.regionName = message.regionName;
        if (message.sessionId != null && message.hasOwnProperty("sessionId"))
            object.sessionId = message.sessionId;
        return object;
    };

    /**
     * Converts this AwsConfig to JSON.
     * @function toJSON
     * @memberof AwsConfig
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    AwsConfig.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for AwsConfig
     * @function getTypeUrl
     * @memberof AwsConfig
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    AwsConfig.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/AwsConfig";
    };

    return AwsConfig;
})();

/**
 * PageSort enum.
 * @exports PageSort
 * @enum {number}
 * @property {number} ASC=0 ASC value
 * @property {number} DESC=1 DESC value
 */
export const PageSort = $root.PageSort = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "ASC"] = 0;
    values[valuesById[1] = "DESC"] = 1;
    return values;
})();

/**
 * UploadChannelType enum.
 * @exports UploadChannelType
 * @enum {number}
 * @property {number} OSS_DEFAULT=0 OSS_DEFAULT value
 * @property {number} OSS_CHAT=1 OSS_CHAT value
 * @property {number} OSS_LOW_RATE=2 OSS_LOW_RATE value
 */
export const UploadChannelType = $root.UploadChannelType = (() => {
    const valuesById = {}, values = Object.create(valuesById);
    values[valuesById[0] = "OSS_DEFAULT"] = 0;
    values[valuesById[1] = "OSS_CHAT"] = 1;
    values[valuesById[2] = "OSS_LOW_RATE"] = 2;
    return values;
})();

export const LinkObj = $root.LinkObj = (() => {

    /**
     * Properties of a LinkObj.
     * @exports ILinkObj
     * @interface ILinkObj
     * @property {string|null} [link] LinkObj link
     * @property {number|null} [location] LinkObj location
     * @property {number|null} [length] LinkObj length
     */

    /**
     * Constructs a new LinkObj.
     * @exports LinkObj
     * @classdesc Represents a LinkObj.
     * @implements ILinkObj
     * @constructor
     * @param {ILinkObj=} [properties] Properties to set
     */
    function LinkObj(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * LinkObj link.
     * @member {string} link
     * @memberof LinkObj
     * @instance
     */
    LinkObj.prototype.link = "";

    /**
     * LinkObj location.
     * @member {number} location
     * @memberof LinkObj
     * @instance
     */
    LinkObj.prototype.location = 0;

    /**
     * LinkObj length.
     * @member {number} length
     * @memberof LinkObj
     * @instance
     */
    LinkObj.prototype.length = 0;

    /**
     * Creates a new LinkObj instance using the specified properties.
     * @function create
     * @memberof LinkObj
     * @static
     * @param {ILinkObj=} [properties] Properties to set
     * @returns {LinkObj} LinkObj instance
     */
    LinkObj.create = function create(properties) {
        return new LinkObj(properties);
    };

    /**
     * Encodes the specified LinkObj message. Does not implicitly {@link LinkObj.verify|verify} messages.
     * @function encode
     * @memberof LinkObj
     * @static
     * @param {ILinkObj} message LinkObj message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    LinkObj.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.link != null && Object.hasOwnProperty.call(message, "link"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.link);
        if (message.location != null && Object.hasOwnProperty.call(message, "location"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.location);
        if (message.length != null && Object.hasOwnProperty.call(message, "length"))
            writer.uint32(/* id 3, wireType 0 =*/24).int32(message.length);
        return writer;
    };

    /**
     * Encodes the specified LinkObj message, length delimited. Does not implicitly {@link LinkObj.verify|verify} messages.
     * @function encodeDelimited
     * @memberof LinkObj
     * @static
     * @param {ILinkObj} message LinkObj message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    LinkObj.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a LinkObj message from the specified reader or buffer.
     * @function decode
     * @memberof LinkObj
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {LinkObj} LinkObj
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    LinkObj.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.LinkObj();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.link = reader.string();
                    break;
                }
            case 2: {
                    message.location = reader.int32();
                    break;
                }
            case 3: {
                    message.length = reader.int32();
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
     * Decodes a LinkObj message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof LinkObj
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {LinkObj} LinkObj
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    LinkObj.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a LinkObj message.
     * @function verify
     * @memberof LinkObj
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    LinkObj.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.link != null && message.hasOwnProperty("link"))
            if (!$util.isString(message.link))
                return "link: string expected";
        if (message.location != null && message.hasOwnProperty("location"))
            if (!$util.isInteger(message.location))
                return "location: integer expected";
        if (message.length != null && message.hasOwnProperty("length"))
            if (!$util.isInteger(message.length))
                return "length: integer expected";
        return null;
    };

    /**
     * Creates a LinkObj message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof LinkObj
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {LinkObj} LinkObj
     */
    LinkObj.fromObject = function fromObject(object) {
        if (object instanceof $root.LinkObj)
            return object;
        let message = new $root.LinkObj();
        if (object.link != null)
            message.link = String(object.link);
        if (object.location != null)
            message.location = object.location | 0;
        if (object.length != null)
            message.length = object.length | 0;
        return message;
    };

    /**
     * Creates a plain object from a LinkObj message. Also converts values to other types if specified.
     * @function toObject
     * @memberof LinkObj
     * @static
     * @param {LinkObj} message LinkObj
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    LinkObj.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.link = "";
            object.location = 0;
            object.length = 0;
        }
        if (message.link != null && message.hasOwnProperty("link"))
            object.link = message.link;
        if (message.location != null && message.hasOwnProperty("location"))
            object.location = message.location;
        if (message.length != null && message.hasOwnProperty("length"))
            object.length = message.length;
        return object;
    };

    /**
     * Converts this LinkObj to JSON.
     * @function toJSON
     * @memberof LinkObj
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    LinkObj.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for LinkObj
     * @function getTypeUrl
     * @memberof LinkObj
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    LinkObj.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/LinkObj";
    };

    return LinkObj;
})();

export const FeeConfig = $root.FeeConfig = (() => {

    /**
     * Properties of a FeeConfig.
     * @exports IFeeConfig
     * @interface IFeeConfig
     * @property {number|null} [scenesType] FeeConfig scenesType
     * @property {string|null} [scenesName] FeeConfig scenesName
     * @property {Array.<ICoinFeeConfig>|null} [feeConfigs] FeeConfig feeConfigs
     */

    /**
     * Constructs a new FeeConfig.
     * @exports FeeConfig
     * @classdesc Represents a FeeConfig.
     * @implements IFeeConfig
     * @constructor
     * @param {IFeeConfig=} [properties] Properties to set
     */
    function FeeConfig(properties) {
        this.feeConfigs = [];
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * FeeConfig scenesType.
     * @member {number} scenesType
     * @memberof FeeConfig
     * @instance
     */
    FeeConfig.prototype.scenesType = 0;

    /**
     * FeeConfig scenesName.
     * @member {string} scenesName
     * @memberof FeeConfig
     * @instance
     */
    FeeConfig.prototype.scenesName = "";

    /**
     * FeeConfig feeConfigs.
     * @member {Array.<ICoinFeeConfig>} feeConfigs
     * @memberof FeeConfig
     * @instance
     */
    FeeConfig.prototype.feeConfigs = $util.emptyArray;

    /**
     * Creates a new FeeConfig instance using the specified properties.
     * @function create
     * @memberof FeeConfig
     * @static
     * @param {IFeeConfig=} [properties] Properties to set
     * @returns {FeeConfig} FeeConfig instance
     */
    FeeConfig.create = function create(properties) {
        return new FeeConfig(properties);
    };

    /**
     * Encodes the specified FeeConfig message. Does not implicitly {@link FeeConfig.verify|verify} messages.
     * @function encode
     * @memberof FeeConfig
     * @static
     * @param {IFeeConfig} message FeeConfig message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    FeeConfig.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.scenesType != null && Object.hasOwnProperty.call(message, "scenesType"))
            writer.uint32(/* id 2, wireType 0 =*/16).int32(message.scenesType);
        if (message.scenesName != null && Object.hasOwnProperty.call(message, "scenesName"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.scenesName);
        if (message.feeConfigs != null && message.feeConfigs.length)
            for (let i = 0; i < message.feeConfigs.length; ++i)
                $root.CoinFeeConfig.encode(message.feeConfigs[i], writer.uint32(/* id 4, wireType 2 =*/34).fork()).ldelim();
        return writer;
    };

    /**
     * Encodes the specified FeeConfig message, length delimited. Does not implicitly {@link FeeConfig.verify|verify} messages.
     * @function encodeDelimited
     * @memberof FeeConfig
     * @static
     * @param {IFeeConfig} message FeeConfig message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    FeeConfig.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a FeeConfig message from the specified reader or buffer.
     * @function decode
     * @memberof FeeConfig
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {FeeConfig} FeeConfig
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    FeeConfig.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.FeeConfig();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 2: {
                    message.scenesType = reader.int32();
                    break;
                }
            case 3: {
                    message.scenesName = reader.string();
                    break;
                }
            case 4: {
                    if (!(message.feeConfigs && message.feeConfigs.length))
                        message.feeConfigs = [];
                    message.feeConfigs.push($root.CoinFeeConfig.decode(reader, reader.uint32()));
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
     * Decodes a FeeConfig message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof FeeConfig
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {FeeConfig} FeeConfig
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    FeeConfig.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a FeeConfig message.
     * @function verify
     * @memberof FeeConfig
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    FeeConfig.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.scenesType != null && message.hasOwnProperty("scenesType"))
            if (!$util.isInteger(message.scenesType))
                return "scenesType: integer expected";
        if (message.scenesName != null && message.hasOwnProperty("scenesName"))
            if (!$util.isString(message.scenesName))
                return "scenesName: string expected";
        if (message.feeConfigs != null && message.hasOwnProperty("feeConfigs")) {
            if (!Array.isArray(message.feeConfigs))
                return "feeConfigs: array expected";
            for (let i = 0; i < message.feeConfigs.length; ++i) {
                let error = $root.CoinFeeConfig.verify(message.feeConfigs[i]);
                if (error)
                    return "feeConfigs." + error;
            }
        }
        return null;
    };

    /**
     * Creates a FeeConfig message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof FeeConfig
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {FeeConfig} FeeConfig
     */
    FeeConfig.fromObject = function fromObject(object) {
        if (object instanceof $root.FeeConfig)
            return object;
        let message = new $root.FeeConfig();
        if (object.scenesType != null)
            message.scenesType = object.scenesType | 0;
        if (object.scenesName != null)
            message.scenesName = String(object.scenesName);
        if (object.feeConfigs) {
            if (!Array.isArray(object.feeConfigs))
                throw TypeError(".FeeConfig.feeConfigs: array expected");
            message.feeConfigs = [];
            for (let i = 0; i < object.feeConfigs.length; ++i) {
                if (typeof object.feeConfigs[i] !== "object")
                    throw TypeError(".FeeConfig.feeConfigs: object expected");
                message.feeConfigs[i] = $root.CoinFeeConfig.fromObject(object.feeConfigs[i]);
            }
        }
        return message;
    };

    /**
     * Creates a plain object from a FeeConfig message. Also converts values to other types if specified.
     * @function toObject
     * @memberof FeeConfig
     * @static
     * @param {FeeConfig} message FeeConfig
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    FeeConfig.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.arrays || options.defaults)
            object.feeConfigs = [];
        if (options.defaults) {
            object.scenesType = 0;
            object.scenesName = "";
        }
        if (message.scenesType != null && message.hasOwnProperty("scenesType"))
            object.scenesType = message.scenesType;
        if (message.scenesName != null && message.hasOwnProperty("scenesName"))
            object.scenesName = message.scenesName;
        if (message.feeConfigs && message.feeConfigs.length) {
            object.feeConfigs = [];
            for (let j = 0; j < message.feeConfigs.length; ++j)
                object.feeConfigs[j] = $root.CoinFeeConfig.toObject(message.feeConfigs[j], options);
        }
        return object;
    };

    /**
     * Converts this FeeConfig to JSON.
     * @function toJSON
     * @memberof FeeConfig
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    FeeConfig.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for FeeConfig
     * @function getTypeUrl
     * @memberof FeeConfig
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    FeeConfig.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/FeeConfig";
    };

    return FeeConfig;
})();

export const CoinFeeConfig = $root.CoinFeeConfig = (() => {

    /**
     * Properties of a CoinFeeConfig.
     * @exports ICoinFeeConfig
     * @interface ICoinFeeConfig
     * @property {string|null} [coinName] CoinFeeConfig coinName
     * @property {string|null} [minFee] CoinFeeConfig minFee
     * @property {string|null} [maxFee] CoinFeeConfig maxFee
     * @property {string|null} [baseFee] CoinFeeConfig baseFee
     * @property {string|null} [feeRate] CoinFeeConfig feeRate
     * @property {string|null} [fixedFee] CoinFeeConfig fixedFee
     * @property {number|null} [mathType] CoinFeeConfig mathType
     * @property {number|null} [feeScale] CoinFeeConfig feeScale
     * @property {number|null} [roundingModeType] CoinFeeConfig roundingModeType
     */

    /**
     * Constructs a new CoinFeeConfig.
     * @exports CoinFeeConfig
     * @classdesc Represents a CoinFeeConfig.
     * @implements ICoinFeeConfig
     * @constructor
     * @param {ICoinFeeConfig=} [properties] Properties to set
     */
    function CoinFeeConfig(properties) {
        if (properties)
            for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null)
                    this[keys[i]] = properties[keys[i]];
    }

    /**
     * CoinFeeConfig coinName.
     * @member {string} coinName
     * @memberof CoinFeeConfig
     * @instance
     */
    CoinFeeConfig.prototype.coinName = "";

    /**
     * CoinFeeConfig minFee.
     * @member {string} minFee
     * @memberof CoinFeeConfig
     * @instance
     */
    CoinFeeConfig.prototype.minFee = "";

    /**
     * CoinFeeConfig maxFee.
     * @member {string} maxFee
     * @memberof CoinFeeConfig
     * @instance
     */
    CoinFeeConfig.prototype.maxFee = "";

    /**
     * CoinFeeConfig baseFee.
     * @member {string} baseFee
     * @memberof CoinFeeConfig
     * @instance
     */
    CoinFeeConfig.prototype.baseFee = "";

    /**
     * CoinFeeConfig feeRate.
     * @member {string} feeRate
     * @memberof CoinFeeConfig
     * @instance
     */
    CoinFeeConfig.prototype.feeRate = "";

    /**
     * CoinFeeConfig fixedFee.
     * @member {string} fixedFee
     * @memberof CoinFeeConfig
     * @instance
     */
    CoinFeeConfig.prototype.fixedFee = "";

    /**
     * CoinFeeConfig mathType.
     * @member {number} mathType
     * @memberof CoinFeeConfig
     * @instance
     */
    CoinFeeConfig.prototype.mathType = 0;

    /**
     * CoinFeeConfig feeScale.
     * @member {number} feeScale
     * @memberof CoinFeeConfig
     * @instance
     */
    CoinFeeConfig.prototype.feeScale = 0;

    /**
     * CoinFeeConfig roundingModeType.
     * @member {number} roundingModeType
     * @memberof CoinFeeConfig
     * @instance
     */
    CoinFeeConfig.prototype.roundingModeType = 0;

    /**
     * Creates a new CoinFeeConfig instance using the specified properties.
     * @function create
     * @memberof CoinFeeConfig
     * @static
     * @param {ICoinFeeConfig=} [properties] Properties to set
     * @returns {CoinFeeConfig} CoinFeeConfig instance
     */
    CoinFeeConfig.create = function create(properties) {
        return new CoinFeeConfig(properties);
    };

    /**
     * Encodes the specified CoinFeeConfig message. Does not implicitly {@link CoinFeeConfig.verify|verify} messages.
     * @function encode
     * @memberof CoinFeeConfig
     * @static
     * @param {ICoinFeeConfig} message CoinFeeConfig message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CoinFeeConfig.encode = function encode(message, writer) {
        if (!writer)
            writer = $Writer.create();
        if (message.coinName != null && Object.hasOwnProperty.call(message, "coinName"))
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.coinName);
        if (message.minFee != null && Object.hasOwnProperty.call(message, "minFee"))
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.minFee);
        if (message.maxFee != null && Object.hasOwnProperty.call(message, "maxFee"))
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.maxFee);
        if (message.baseFee != null && Object.hasOwnProperty.call(message, "baseFee"))
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.baseFee);
        if (message.feeRate != null && Object.hasOwnProperty.call(message, "feeRate"))
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.feeRate);
        if (message.fixedFee != null && Object.hasOwnProperty.call(message, "fixedFee"))
            writer.uint32(/* id 6, wireType 2 =*/50).string(message.fixedFee);
        if (message.mathType != null && Object.hasOwnProperty.call(message, "mathType"))
            writer.uint32(/* id 7, wireType 0 =*/56).int32(message.mathType);
        if (message.feeScale != null && Object.hasOwnProperty.call(message, "feeScale"))
            writer.uint32(/* id 8, wireType 0 =*/64).int32(message.feeScale);
        if (message.roundingModeType != null && Object.hasOwnProperty.call(message, "roundingModeType"))
            writer.uint32(/* id 9, wireType 0 =*/72).int32(message.roundingModeType);
        return writer;
    };

    /**
     * Encodes the specified CoinFeeConfig message, length delimited. Does not implicitly {@link CoinFeeConfig.verify|verify} messages.
     * @function encodeDelimited
     * @memberof CoinFeeConfig
     * @static
     * @param {ICoinFeeConfig} message CoinFeeConfig message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    CoinFeeConfig.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim();
    };

    /**
     * Decodes a CoinFeeConfig message from the specified reader or buffer.
     * @function decode
     * @memberof CoinFeeConfig
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {CoinFeeConfig} CoinFeeConfig
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CoinFeeConfig.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        let end = length === undefined ? reader.len : reader.pos + length, message = new $root.CoinFeeConfig();
        while (reader.pos < end) {
            let tag = reader.uint32();
            if (tag === error)
                break;
            switch (tag >>> 3) {
            case 1: {
                    message.coinName = reader.string();
                    break;
                }
            case 2: {
                    message.minFee = reader.string();
                    break;
                }
            case 3: {
                    message.maxFee = reader.string();
                    break;
                }
            case 4: {
                    message.baseFee = reader.string();
                    break;
                }
            case 5: {
                    message.feeRate = reader.string();
                    break;
                }
            case 6: {
                    message.fixedFee = reader.string();
                    break;
                }
            case 7: {
                    message.mathType = reader.int32();
                    break;
                }
            case 8: {
                    message.feeScale = reader.int32();
                    break;
                }
            case 9: {
                    message.roundingModeType = reader.int32();
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
     * Decodes a CoinFeeConfig message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof CoinFeeConfig
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {CoinFeeConfig} CoinFeeConfig
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    CoinFeeConfig.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
            reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
    };

    /**
     * Verifies a CoinFeeConfig message.
     * @function verify
     * @memberof CoinFeeConfig
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    CoinFeeConfig.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
            return "object expected";
        if (message.coinName != null && message.hasOwnProperty("coinName"))
            if (!$util.isString(message.coinName))
                return "coinName: string expected";
        if (message.minFee != null && message.hasOwnProperty("minFee"))
            if (!$util.isString(message.minFee))
                return "minFee: string expected";
        if (message.maxFee != null && message.hasOwnProperty("maxFee"))
            if (!$util.isString(message.maxFee))
                return "maxFee: string expected";
        if (message.baseFee != null && message.hasOwnProperty("baseFee"))
            if (!$util.isString(message.baseFee))
                return "baseFee: string expected";
        if (message.feeRate != null && message.hasOwnProperty("feeRate"))
            if (!$util.isString(message.feeRate))
                return "feeRate: string expected";
        if (message.fixedFee != null && message.hasOwnProperty("fixedFee"))
            if (!$util.isString(message.fixedFee))
                return "fixedFee: string expected";
        if (message.mathType != null && message.hasOwnProperty("mathType"))
            if (!$util.isInteger(message.mathType))
                return "mathType: integer expected";
        if (message.feeScale != null && message.hasOwnProperty("feeScale"))
            if (!$util.isInteger(message.feeScale))
                return "feeScale: integer expected";
        if (message.roundingModeType != null && message.hasOwnProperty("roundingModeType"))
            if (!$util.isInteger(message.roundingModeType))
                return "roundingModeType: integer expected";
        return null;
    };

    /**
     * Creates a CoinFeeConfig message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof CoinFeeConfig
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {CoinFeeConfig} CoinFeeConfig
     */
    CoinFeeConfig.fromObject = function fromObject(object) {
        if (object instanceof $root.CoinFeeConfig)
            return object;
        let message = new $root.CoinFeeConfig();
        if (object.coinName != null)
            message.coinName = String(object.coinName);
        if (object.minFee != null)
            message.minFee = String(object.minFee);
        if (object.maxFee != null)
            message.maxFee = String(object.maxFee);
        if (object.baseFee != null)
            message.baseFee = String(object.baseFee);
        if (object.feeRate != null)
            message.feeRate = String(object.feeRate);
        if (object.fixedFee != null)
            message.fixedFee = String(object.fixedFee);
        if (object.mathType != null)
            message.mathType = object.mathType | 0;
        if (object.feeScale != null)
            message.feeScale = object.feeScale | 0;
        if (object.roundingModeType != null)
            message.roundingModeType = object.roundingModeType | 0;
        return message;
    };

    /**
     * Creates a plain object from a CoinFeeConfig message. Also converts values to other types if specified.
     * @function toObject
     * @memberof CoinFeeConfig
     * @static
     * @param {CoinFeeConfig} message CoinFeeConfig
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    CoinFeeConfig.toObject = function toObject(message, options) {
        if (!options)
            options = {};
        let object = {};
        if (options.defaults) {
            object.coinName = "";
            object.minFee = "";
            object.maxFee = "";
            object.baseFee = "";
            object.feeRate = "";
            object.fixedFee = "";
            object.mathType = 0;
            object.feeScale = 0;
            object.roundingModeType = 0;
        }
        if (message.coinName != null && message.hasOwnProperty("coinName"))
            object.coinName = message.coinName;
        if (message.minFee != null && message.hasOwnProperty("minFee"))
            object.minFee = message.minFee;
        if (message.maxFee != null && message.hasOwnProperty("maxFee"))
            object.maxFee = message.maxFee;
        if (message.baseFee != null && message.hasOwnProperty("baseFee"))
            object.baseFee = message.baseFee;
        if (message.feeRate != null && message.hasOwnProperty("feeRate"))
            object.feeRate = message.feeRate;
        if (message.fixedFee != null && message.hasOwnProperty("fixedFee"))
            object.fixedFee = message.fixedFee;
        if (message.mathType != null && message.hasOwnProperty("mathType"))
            object.mathType = message.mathType;
        if (message.feeScale != null && message.hasOwnProperty("feeScale"))
            object.feeScale = message.feeScale;
        if (message.roundingModeType != null && message.hasOwnProperty("roundingModeType"))
            object.roundingModeType = message.roundingModeType;
        return object;
    };

    /**
     * Converts this CoinFeeConfig to JSON.
     * @function toJSON
     * @memberof CoinFeeConfig
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    CoinFeeConfig.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
    };

    /**
     * Gets the default type url for CoinFeeConfig
     * @function getTypeUrl
     * @memberof CoinFeeConfig
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    CoinFeeConfig.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
            typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/CoinFeeConfig";
    };

    return CoinFeeConfig;
})();

export { $root as default };
