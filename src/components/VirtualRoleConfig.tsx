import { ChatContext, ChatManagement } from "@/core/ChatManagement";
import { KeyValueData } from "@/core/KeyValueData";
import { getUuid } from "@/core/utils";
import { CtxRole, VirtualRole } from "@/Models/DataBase";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
    Button,
    Checkbox,
    Form,
    Input,
    Popconfirm,
    Space,
    Switch,
    Tabs,
    Tag,
    theme,
    Typography
} from "antd";
import { useContext, useEffect, useState } from "react";
import ImageUpload from "./AvatarUpload";
import { DragList } from "./DragList";
import { EditVirtualRoleSetting } from "./EditVirtualRoleSetting";

let copyRoleVal: VirtualRole | undefined = undefined;

export const VirtualRoleConfig = ({
  chatMgt,
  onCancel,
  onSaved,
}: {
  chatMgt?: ChatManagement;
  onSaved: () => void;
  onCancel: () => void;
}) => {
  const [virtualRole_Avatar, setVirtualRole_Avatar] = useState(
    chatMgt?.virtualRole.avatar
  );
  const [user_Avatar, setUser_Avatar] = useState(chatMgt?.user.avatar);
  const [settingFilterText, setSettingFilterText] = useState("");
  const { token } = theme.useToken();
  const { setChat } = useContext(ChatContext);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [virtualRole_settings, setVirtualRole_settings] = useState(
    chatMgt?.virtualRole.settings?.map((v, i) => ({
      ...v,
      key: getUuid(),
      edit: false,
    })) || []
  );
  useEffect(() => {
    let tags: string[] = [];
    let tagsmap = new Map<string, number>();
    virtualRole_settings.forEach((v) => {
      v.tags.forEach((tag) => {
        if (tagsmap.has(tag)) tagsmap.set(tag, tagsmap.get(tag)! + 1);
        else tagsmap.set(tag, 1);
      });
    });
    tags = Array.from(tagsmap.keys()).sort(
      (l, n) => tagsmap.get(n)! - tagsmap.get(l)!
    );
    setTags(tags);
  }, [chatMgt, virtualRole_settings]);
  const [form] = Form.useForm<{
    virtualRole_name: string;
    virtualRole_bio: string;
    virtualRole_enable: boolean;
    virtualRole_en_name: string;
    user_name: string;
    user_en_name: string;
  }>();
  const handleChange = (tag: string, checked: boolean) => {
    const nextSelectedTags = checked
      ? [...selectedTags, tag]
      : selectedTags.filter((t) => t !== tag);
    setSelectedTags(nextSelectedTags);
  };
  function onSave() {
    let values = form.getFieldsValue();
    if (!chatMgt) return;
    chatMgt.virtualRole.name = values.virtualRole_name;
    chatMgt.virtualRole.bio = values.virtualRole_bio;
    virtualRole_settings.forEach((v) =>
      v.ctx.forEach((c) => (c.content = c.content?.trim()))
    );
    chatMgt.virtualRole.settings = virtualRole_settings
      .filter((f) => f && (f.ctx.filter((_f) => _f.content).length || f.title))
      .map((v) => ({ ...v, key: undefined, edit: undefined }));
    chatMgt.virtualRole.avatar = virtualRole_Avatar || "";
    chatMgt.virtualRole.enName = values.virtualRole_en_name;
    chatMgt.saveVirtualRoleBio();

    chatMgt.config.enableVirtualRole = values.virtualRole_enable;
    chatMgt.saveConfig();

    chatMgt.user.name = values.user_name;
    chatMgt.user.enName = values.user_en_name;
    chatMgt.user.avatar = user_Avatar || "";
    chatMgt.saveUser();
    setChat(new ChatManagement(chatMgt));
    onSaved();
  }
  function isShow(item: {
    key: string;
    edit: boolean;
    extensionId?: string | undefined;
    title?: string | undefined;
    checked: boolean;
    tags: string[];
    ctx: {
      role: CtxRole;
      content: string;
    }[];
  }): boolean {
    let show = true;
    if (settingFilterText) {
      show =
        item.title?.includes(settingFilterText) ||
        item.tags.filter((f) => f.includes(settingFilterText)).length > 0;
    }
    if (selectedTags.length > 0) {
      show =
        show && item.tags.filter((f) => selectedTags.includes(f)).length > 0;
    }
    return show;
  }
  return (
    <>
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        initialValues={{
          setting_apitoken: KeyValueData.instance().getApiKey(),
          virtualRole_name: chatMgt?.virtualRole.name,
          virtualRole_bio: chatMgt?.virtualRole.bio,
          virtualRole_enable: chatMgt?.config.enableVirtualRole,
          virtualRole_en_name: chatMgt?.virtualRole.enName,
          user_name: chatMgt?.user.name,
          user_en_name: chatMgt?.user.enName,
        }}
      >
        <div
          style={{
            maxHeight: "70vh",
            width: "min(90vw, 500px)",
            overflow: "auto",
            padding: token.paddingContentHorizontalSM + "px",
          }}
        >
          <Space size={32}>
            <Form.Item
              name="virtualRole_enable"
              label="启用助理"
              valuePropName="checked"
            >
              <Switch></Switch>
            </Form.Item>
            <Form.Item name="virtualRole_copy" label="复制配置">
              <Button.Group>
                <Button
                  onClick={() => {
                    copyRoleVal = JSON.parse(
                      JSON.stringify(chatMgt?.virtualRole)
                    );
                  }}
                >
                  复制
                </Button>
                <Button
                  disabled={!copyRoleVal}
                  onClick={() => {
                    form.setFieldValue("virtualRole_name", copyRoleVal?.name);
                    form.setFieldValue("virtualRole_bio", copyRoleVal?.bio);
                    form.setFieldValue(
                      "virtualRole_settings",
                      copyRoleVal?.settings
                    );
                  }}
                >
                  粘贴
                </Button>
              </Button.Group>
            </Form.Item>
          </Space>
          <Tabs
            type="card"
            style={{ minHeight: "calc(70vh - 118px)" }}
            items={[
              {
                label: `助理设定`,
                key: "virtualRole",
                children: (
                  <div>
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        gap: "10px",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <Form.Item>
                          <ImageUpload
                            avatar={virtualRole_Avatar || undefined}
                            onSave={setVirtualRole_Avatar}
                          />
                        </Form.Item>
                        <Form.Item
                          style={{ flex: 1 }}
                          name="virtualRole_name"
                          label="助理名称"
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          style={{ flex: 1 }}
                          name="virtualRole_en_name"
                          label="英文名称;用于区分角色"
                          rules={[
                            {
                              type: "string",
                              pattern: /^[a-zA-Z0-9]+$/,
                              message: "只能使用大小写字母和数字",
                            },
                          ]}
                        >
                          <Input />
                        </Form.Item>
                      </div>
                      <div>
                        <Form.Item>
                          <ImageUpload
                            avatar={user_Avatar || undefined}
                            onSave={setUser_Avatar}
                          />
                        </Form.Item>
                        <Form.Item
                          style={{ flex: 1 }}
                          name="user_name"
                          label="用户名称"
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          style={{ flex: 1 }}
                          name="user_en_name"
                          label="英文名称;用于区分角色"
                          rules={[
                            {
                              type: "string",
                              pattern: /^[a-zA-Z0-9]+$/,
                              message: "只能使用大小写字母和数字",
                            },
                          ]}
                        >
                          <Input />
                        </Form.Item>
                      </div>
                    </div>
                    <Form.Item
                      name="virtualRole_bio"
                      label="助理设定"
                      extra="当助理模式开启时，所有发送的内容都将以此内容开头"
                    >
                      <Input.TextArea autoSize />
                    </Form.Item>
                  </div>
                ),
              },
              {
                label: `设定列表`,
                key: "settings",
                children: (
                  <>
                    <Form.Item label="搜索配置" noStyle>
                      <Input.Search
                        onSearch={(val) => {
                          setSettingFilterText(val);
                          setVirtualRole_settings((v) => [...v]);
                        }}
                      />
                    </Form.Item>
                    <Form.Item>
                      <Space size={[0, 8]} wrap style={{ overflow: "auto" }}>
                        {tags.slice(0, Math.min(50, tags.length)).map((tag) => (
                          <Tag.CheckableTag
                            key={tag}
                            checked={selectedTags.includes(tag)}
                            onChange={(checked) => handleChange(tag, checked)}
                          >
                            {tag}
                          </Tag.CheckableTag>
                        ))}
                      </Space>
                    </Form.Item>
                    <Form.Item>
                      <DragList
                        data={virtualRole_settings}
                        onChange={(data) => {
                          setVirtualRole_settings(data);
                        }}
                        itemDom={(item) => {
                          return isShow(item) ? (
                            <div
                              style={{
                                flex: 1,
                                marginLeft: 10,
                                marginBottom: 8,
                                display: "flex",
                                width: 0,
                                cursor: "pointer",
                              }}
                            >
                              <EditVirtualRoleSetting
                                item={item}
                                allTags={tags}
                                visible={item.edit}
                                onCancel={() => {
                                  item.edit = false;
                                  setVirtualRole_settings((v) => [...v]);
                                }}
                                onSave={(_item) => {
                                  _item.edit = false;
                                  setVirtualRole_settings((v) =>
                                    v.map((a) =>
                                      a.key == _item.key ? _item : a
                                    )
                                  );
                                }}
                              />
                              <div
                                style={{ flex: 1 }}
                                onClick={() => {
                                  item.edit = true;
                                  setVirtualRole_settings((v) => [...v]);
                                }}
                              >
                                {item.title ? (
                                  <div
                                    style={{ borderBottom: "1px solid #ccc2" }}
                                  >
                                    <Typography.Text ellipsis>
                                      {item.tags
                                        .slice(0, Math.min(item.tags.length, 3))
                                        .map((v) => (
                                          <Tag
                                            key={"setting_tag_" + v}
                                            color="green"
                                          >
                                            {v}
                                          </Tag>
                                        ))}{" "}
                                      {item.title}
                                    </Typography.Text>
                                  </div>
                                ) : (
                                  <></>
                                )}
                                <Typography.Text
                                  style={{ width: "min(100vw - 150px, 400px)" }}
                                  type="secondary"
                                  ellipsis={true}
                                >
                                  {item.ctx.length
                                    ? item.ctx[0].content
                                    : "没有内容"}
                                </Typography.Text>
                                {!item.title && item.ctx.length > 1 ? (
                                  <Typography.Text
                                    style={{
                                      width: "min(100vw - 150px, 400px)",
                                    }}
                                    type="secondary"
                                    ellipsis={true}
                                  >
                                    {item.ctx[1].content}
                                  </Typography.Text>
                                ) : (
                                  <></>
                                )}
                              </div>
                              <div style={{ width: 30 }}>
                                <Space direction="vertical">
                                  <Checkbox
                                    checked={item.checked}
                                    onChange={(e) => {
                                      item.checked = e.target.checked;
                                      setVirtualRole_settings((v) => [...v]);
                                    }}
                                  ></Checkbox>
                                  <Popconfirm
                                    title="确定删除？"
                                    onConfirm={() => {
                                      setVirtualRole_settings((v) =>
                                        v.filter((f) => f != item)
                                      );
                                    }}
                                    okText="确定"
                                    cancelText="取消"
                                  >
                                    <DeleteOutlined
                                      style={{ color: "#ff8d8f" }}
                                    ></DeleteOutlined>
                                  </Popconfirm>
                                </Space>
                              </div>
                            </div>
                          ) : undefined;
                        }}
                      />
                      <Form.Item extra="当助理模式开启时，这些内容将追加在设定后面">
                        <Button
                          type="dashed"
                          onClick={() => {
                            setVirtualRole_settings((v) => [
                              ...v,
                              {
                                checked: true,
                                tags: [],
                                ctx: [],
                                key: getUuid(),
                                edit: false,
                              },
                            ]);
                          }}
                          block
                          icon={<PlusOutlined />}
                        >
                          增加设定
                        </Button>
                      </Form.Item>
                    </Form.Item>
                  </>
                ),
              },
              {
                label: `插件列表`,
                key: "extensions_cloud",
                children: <div>功能未完成，占个地</div>,
              },
            ]}
          />
        </div>
        <Button.Group style={{ width: "100%" }}>
          <Button
            block
            style={{ marginTop: "20px" }}
            onClick={(e) => {
              onCancel();
            }}
          >
            关闭
          </Button>
          <Button
            block
            style={{ marginTop: "20px" }}
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
          >
            保存
          </Button>
        </Button.Group>
      </Form>
    </>
  );
};
