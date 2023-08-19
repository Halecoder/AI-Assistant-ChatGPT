import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { useSendMessage } from "@/core/hooks";
import { activityScroll, pagesUtil } from "@/core/utils";
import { Message } from "@/Models/DataBase";
import { TopicMessage } from "@/Models/Topic";
import { Button } from "antd";
import { useCallback, useContext, useEffect, useState } from "react";
import { MessageContext } from "./Chat";
import { useInput } from "./InputUtil";
import { MemoInsertInput } from "./InsertInput";
import { MemoMessageItem } from "./MessageItem";

// 这里可能造成内存泄漏 重新渲染ChatMessage时必须清除
const topicRender: { [key: string]: (messageId?: string | number) => void } =
  {};
export function reloadTopic(topicId: string, messageId?: string | number) {
  topicRender[topicId] && topicRender[topicId](messageId);
}

export function MessageList({
  topic,
  chat,
  firstMsgIdxRef,
}: {
  topic: TopicMessage;
  chat: ChatManagement;
  firstMsgIdxRef: React.MutableRefObject<number | undefined>;
}) {
  const { reloadNav, forceRender } = useContext(ChatContext);
  const { setCite } = useContext(MessageContext);
  const { inputRef, setInput } = useInput();
  const [pageSize, setPageSize] = useState(
    Math.max(0, chat.config.pageSize || 0) || 20
  );
  const [repect, setRepect] = useState(
    Math.max(0, chat.config.pageRepect || 0) || 10
  );
  const [pageCount, setPageCount] = useState(
    Math.ceil(topic.messages.length / pageSize)
  );
  const [pageNumber, setPageNumber] = useState(pageCount);
  const [insertIndex, setInsertIndex] = useState(-1);
  const [renderMessage] = useState<{ [key: string]: () => void }>({});
  const [messages, steMessages] = useState<Message[]>([
    ...(forceRender
      ? topic.messages
      : topic.messages.slice(Math.max(-topic.messages.length, -pageSize))),
  ]);
  const [msgIdIdxMap] = useState(new Map<string, number>());
  const { sendMessage } = useSendMessage(chat);
  const rangeMessage = useCallback(
    (pageNumber: number, isEnd = true) => {
      msgIdIdxMap.clear();
      const { range, totalPages, pageIndex } = pagesUtil(
        topic.messages,
        pageNumber,
        pageSize,
        repect,
        isEnd
      );
      setPageCount(totalPages);
      steMessages(range);
      setPageNumber(pageIndex);
      topic.messages.forEach((m, idx) => {
        msgIdIdxMap.set(m.id + "", idx);
      });
      return range;
    },
    [topic, pageSize, repect,msgIdIdxMap]
  );
  useEffect(() => {
    rangeMessage(999999999999); // 为了省事，直接写了一个几乎不可能存在的页数，会自动转换成最后一页的
  }, [pageSize, rangeMessage]);
  useEffect(() => {
    setPageSize(Math.max(0, chat.config.pageSize || 0) || 20);
    setRepect(Math.max(0, chat.config.pageRepect || 0) || 10);
  }, [chat]);
  useEffect(() => {
    firstMsgIdxRef.current = msgIdIdxMap.get(messages[0]?.id);
    return () => {
      firstMsgIdxRef.current = undefined;
    };
  }, [messages, firstMsgIdxRef, msgIdIdxMap]);

  const rBak = useCallback(
    (v: Message) => {
      setInput(
        (m) =>
          (m ? m + "\n" : m) +
          (!m
            ? v.ctxRole == "system"
              ? "/::"
              : v.ctxRole == "assistant"
              ? "/"
              : ""
            : "") +
          v.text
      );
      inputRef.current?.focus();
    },
    [inputRef, setInput]
  );
  const onDel = useCallback(
    (msg: Message) => {
      chat.removeMessage(msg)?.then(() => {
        let idx = msgIdIdxMap.get(msg.id);
        delete renderMessage[msg.id];
        rangeMessage(idx !== undefined ? idx : pageNumber);
        reloadNav(topic);
      });
    },
    [
      renderMessage,
      rangeMessage,
      topic,
      chat,
      reloadNav,
      pageNumber,
      msgIdIdxMap,
    ]
  );
  const onPush = useCallback(async (idx: number) => {
    setInsertIndex(idx);
  }, []);
  useEffect(() => {
    let timer = setTimeout(() => {}, 100);
    topicRender[topic.id] = (messageId?: string | number) => {
      if (typeof messageId == "number") {
        rangeMessage(
          Math.ceil((messageId + 1) / pageSize),
          messageId % pageSize >= pageSize / 2
        );
        return;
      }
      if (messageId) {
        return renderMessage[messageId] && renderMessage[messageId]();
      }
      rangeMessage(pageCount + 1);
    };
    return () => {
      clearTimeout(timer);
      delete topicRender[topic.id];
      Object.keys(renderMessage).forEach((key) => delete renderMessage[key]);
    };
  }, [rangeMessage, renderMessage, topic, pageCount, pageSize]);
  return (
    <>
      {pageNumber > 1 ? (
        <Button.Group style={{ width: "100%" }}>
          <Button
            block
            type="text"
            onClick={() => {
              rangeMessage(pageNumber - 1);
            }}
          >
            上一页
          </Button>
          <Button
            block
            type="text"
            onClick={() => {
              rangeMessage(1);
            }}
          >
            顶部
          </Button>
        </Button.Group>
      ) : (
        <></>
      )}
      {messages.map((v, i) => {
        let idx = msgIdIdxMap.get(v.id);
        if (idx === undefined) idx = messages.length - 1;
        return (
          <div key={v.id}>
            <MemoMessageItem
              renderMessage={renderMessage}
              msg={v}
              onDel={onDel}
              rBak={rBak}
              onCite={setCite}
              onPush={() => {
                onPush(idx!);
              }}
              onSned={() => {
                activityScroll({ botton: true });
                sendMessage(idx!, topic);
              }}
            ></MemoMessageItem>
            {idx === insertIndex && (
              <MemoInsertInput
                key={"insert_input"}
                insertIndex={idx + 1}
                topic={topic}
                chat={chat}
                onHidden={() => setInsertIndex(-1)}
              />
            )}
            {i == messages.length - 1 && (
              <div style={{ marginTop: "2em" }}></div>
            )}
          </div>
        );
      })}

      {pageNumber < pageCount ? (
        <Button.Group style={{ width: "100%", marginTop: "2em" }}>
          <Button
            block
            type="text"
            onClick={() => {
              rangeMessage(pageNumber + 1, false);
            }}
          >
            下一页
          </Button>
          <Button
            block
            type="text"
            onClick={() => {
              rangeMessage(pageCount);
            }}
          >
            底部
          </Button>
        </Button.Group>
      ) : (
        <></>
      )}
    </>
  );
}
