import type { Meta, StoryObj } from "@storybook/react";
import { MenuTable } from "../../../web/src/shared/ui";

const meta: Meta<typeof MenuTable> = {
  title: "Components/MenuTable",
  component: MenuTable,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof MenuTable>;

export const Playground: Story = {
  render: (args) => (
    <div style={{ width: 328 }}>
      <MenuTable {...args} />
    </div>
  ),
};

export const WithRows: Story = {
  name: "여러 td",
  render: () => (
    <div style={{ width: 328 }}>
      <MenuTable
        rows={[
          { label: "메뉴 1", onClick: () => alert("메뉴 1") },
          { label: "메뉴 2", onClick: () => alert("메뉴 2") },
          { label: "메뉴 3", onClick: () => alert("메뉴 3") },
        ]}
      />
    </div>
  ),
};
