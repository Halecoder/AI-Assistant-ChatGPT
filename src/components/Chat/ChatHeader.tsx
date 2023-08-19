import { ChatContext } from "@/core/ChatManagement";
import { useScreenSize } from "@/core/hooks";
import {
  SearchOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  UserAddOutlined
} from "@ant-design/icons";
import { Avatar, Drawer, Layout, theme, Typography } from "antd";
import Image from "next/image";
import React, { useContext, useState } from "react";
import { MemoBackgroundImage } from "../BackgroundImage";
import { ChatList } from "../ChatList";
import { Modal } from "../Modal";
import { Setting } from "../Setting";
import { SkipExport } from "../SkipExport";
import { VirtualRoleConfig } from "../VirtualRoleConfig";
import { reloadTopic } from "./MessageList";
import { MemoSearchWrap } from "./Search";

export const ChatHeader = () => {
  const { chatMgt: chat, activityTopic } = useContext(ChatContext);
  const { token } = theme.useToken();
  const [settingIsShow, setSettingShow] = useState(false);
  const [listIsShow, setlistIsShow] = useState(false);
  const [roleConfigShow, setRoleConfigShow] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const screenSize = useScreenSize();
  return (
    <Layout.Header
      style={{
        flexWrap: "nowrap",
        // gap: "16px",
        width: "100%",
        justifyContent: "flex-end",
        display: "flex",
        alignItems: "center",
        marginBottom: "3px",
        padding: "10px",
        height: "52px",
        position: "relative",
        borderRadius:
          "0" + " 0 " + token.borderRadius + "px " + token.borderRadius + "px",
        backgroundColor:
          chat.config.renderType == "document"
            ? token.colorInfoBg
            : token.colorFillContent,
      }}
    >
      <Avatar
        onClick={(v) => {
          setRoleConfigShow(!roleConfigShow);
        }}
        size={32}
        style={{ minWidth: "32px", minHeight: "32px" }}
        src={chat.group.avatar || chat?.virtualRole.avatar || undefined}
        icon={<Image width={32} height={32} src={"/logo.png"} alt="logo" />}
      ></Avatar>
      <span style={{ marginLeft: 10 }}></span>
      <Typography.Text ellipsis onClick={() => setSettingShow(!settingIsShow)}>
        {chat?.group.name}
      </Typography.Text>
      <span style={{ flex: 1 }}></span>
      <SkipExport>
        <SearchOutlined
          style={{ padding: "5px 10px" }}
          onClick={() => setOpenSearch(true)}
        />
      </SkipExport>
      <Drawer
        placement={"right"}
        closable={false}
        width={Math.min(screenSize.width - 40, 400)}
        key={"search_nav_drawer"}
        bodyStyle={{ padding: "1em 0" }}
        open={openSearch}
        maskStyle={{ backgroundColor: "#0000" }}
        onClose={() => {
          setOpenSearch(false);
        }}
      >
        <MemoBackgroundImage />
        <div
          style={{
            position: "relative",
            height: "100%",
            zIndex: 99,
          }}
        >
          <MemoSearchWrap />
        </div>
      </Drawer>
      <SkipExport>
        <UserAddOutlined
          style={{ padding: "5px 10px" }}
          onClick={() => setRoleConfigShow(!roleConfigShow)}
        />
      </SkipExport>
      <SkipExport>
        {" "}
        <SettingOutlined
          onClick={() => setSettingShow(!settingIsShow)}
          style={{ padding: "5px 10px" }}
        />
      </SkipExport>
      <SkipExport>
        <UnorderedListOutlined
          onClick={() => {
            setlistIsShow(!listIsShow);
          }}
          style={{ padding: "5px 10px" }}
        />
      </SkipExport>
      <Modal
        isShow={roleConfigShow}
        onCancel={() => {}}
        items={
          <VirtualRoleConfig
            onCancel={() => {
              setRoleConfigShow(false);
            }}
            onSaved={() => {
              setRoleConfigShow(false);
              if (activityTopic) reloadTopic(activityTopic.id);
            }}
            chatMgt={chat}
          ></VirtualRoleConfig>
        }
      ></Modal>
      <Modal
        isShow={settingIsShow}
        maxHight={"calc(70vh + 84px)"}
        onCancel={() => {
          setSettingShow(false);
        }}
        items={
          <Setting
            onCancel={() => {
              setSettingShow(false);
            }}
            onSaved={() => {
              setSettingShow(false);
            }}
            chatMgt={chat}
          ></Setting>
        }
      ></Modal>
      <Modal
        isShow={listIsShow}
        maxHight={"calc(70vh + 84px)"}
        onCancel={() => {
          setlistIsShow(false);
        }}
        items={
          <ChatList
            onCacle={() => {
              setlistIsShow(false);
            }}
          ></ChatList>
        }
      ></Modal>
    </Layout.Header>
  );
};
export const MemoChatHeader = React.memo(ChatHeader);
