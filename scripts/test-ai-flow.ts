// Test AI flow
// Run with: npx tsx scripts/test-ai-flow.ts

import { reorganizeContentWithLogic } from '../src/lib/miniMaxClient';

const testContent = `
## 年度工作总结

### 一、基本情况
我是市场部经理，负责华东区市场开拓。团队共有15人。

### 二、主要工作
1. 完成销售额5000万，超额完成目标20%
2. 开拓新客户50家
3. 成功举办3场行业峰会

### 三、团队建设
培养了3名骨干员工，团队流失率为0

### 四、存在的不足
1. 部分区域市场开拓进度较慢
2. 团队培训体系还不够完善
`;

const userLogic = '突出去年的贡献点，不需要团队情况，不需要个人不足，让老板觉得你最牛，风格最好采用华为风格';
const targetPageCount = 5;

async function test() {
  console.log('=== Test AI Flow ===\n');
  console.log('User Logic:', userLogic);
  console.log('Target Pages:', targetPageCount);
  console.log('\n--- Reorganization ---\n');

  try {
    const reorganized = await reorganizeContentWithLogic(
      testContent,
      userLogic,
      targetPageCount
    );
    console.log('Reorganized result:');
    console.log(JSON.stringify(reorganized, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}

test();
