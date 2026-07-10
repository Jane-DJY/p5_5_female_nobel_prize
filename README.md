# P5_5_女性诺贝尔奖

一个 p5.js 数据视觉草稿：1901-2025 年诺奖与经济学奖个人获奖者被画成从夜空落下的星星。

- 总个人获奖者：990
- 女性：67
- 男性：923
- 组织：28 个，不进入星星计数

数据按 Nobel 官方 API 的 laureates 列表计算：只统计个人获奖者，不统计组织；同一人多次获奖时按其第一次获奖年份计入，所以累计结尾对应 990 位个人获奖者、67 位女性个人。

数据来源：

- https://api.nobelprize.org/2.1/laureates?limit=1200
- https://www.nobelprize.org/prizes/lists/nobel-prize-awarded-women/
- https://www.nobelprize.org/prizes/lists/all-nobel-prizes/
