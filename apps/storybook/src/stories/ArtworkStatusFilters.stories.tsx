import type { Meta, StoryObj } from "@storybook/react";
import { ArtworkStatusFilters } from "../../../web/src/features/artwork-status-filter";

const meta: Meta<typeof ArtworkStatusFilters> = {
  title: "Domain/ArtworkStatusFilters",
  component: ArtworkStatusFilters,
  parameters: { layout: "padded" },
  args: {
    groupLabel: "제작 대기",
    filters: [{ label: "예약 확정", count: 1 }],
  },
};

export default meta;
type Story = StoryObj<typeof ArtworkStatusFilters>;

export const Playground: Story = {};

const groups = [
  { groupLabel: "제작 대기", filters: [{ label: "예약 확정", count: 1 }] },
  {
    groupLabel: "제작 중",
    filters: [
      { label: "건조", count: 1 },
      { label: "초벌", count: 1 },
      { label: "유약", count: 1 },
      { label: "재벌", count: 1 },
    ],
  },
  {
    groupLabel: "수령 대기",
    filters: [
      { label: "배송 중", count: 1 },
      { label: "픽업 가능", count: 1 },
    ],
  },
  {
    groupLabel: "수령 완료",
    filters: [
      { label: "배송 완료", count: 1 },
      { label: "픽업 완료", count: 1 },
    ],
  },
];

export const AllGroups: Story = {
  name: "statusGroup 전체",
  render: () => (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <ArtworkStatusFilters
          key={group.groupLabel}
          groupLabel={group.groupLabel}
          filters={group.filters}
        />
      ))}
    </div>
  ),
};
