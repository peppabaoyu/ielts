---
name: ielts-vocab-workflow
description: 用户的雅思阅读生词/长难句查询与归档工作流——按真题位置标识（如 C16 p38 t2p1）分类记录
metadata:
  node_type: memory
  type: project
  originSessionId: session_70e6b7305785db4723e4cc70b496d011
---

用户在备考雅思，做阅读后会把文章里的生词和长难句发到对话里查询，要求持久记录并归纳。

工作流（自 2026-10-28 约定，2026-10-28 修正）：
1. 位置标识格式 `C{套数} p{页码} t{test}p{passage}`，如 `C16 p38 t2p1` = 剑桥雅思真题第 16 套、书中第 38 页、Test 2、Passage 1。按用户给出的标识原样归档，不要自行换算。
2. 标识只在切换时发送一次：用户发出新标识后，之后所有不带标识的消息都属于该标识（"当前章节"），直到出现下一个新标识。不要要求用户每条消息都带标识；消息里出现新标识即切换。
3. 同一条消息可能带多个生词或多句话，全部归到当前标识下。
4. 生词条目需提供：英式音标（IPA）、词性、中文释义（结合文中语境，常用义优先）。
5. 长难句条目需提供：整句中文翻译、句子结构分析（主干、从句、插入语等）。
6. 每次查询后必须把条目追加到同目录的 [[ielts-vocab-data]]（ielts-vocab-data.md）对应章节；标识第一次出现时新增章节（生词表 + 长难句列表）。
7. 用户可能随时要求导出全部归纳，届时读取 ielts-vocab-data.md 整理输出即可，不要从头重查。
8. 高频词标注（2026-10-28 用户明确提出）：讲解中若带出雅思高频词或高频考点用法（如 dislodge 带出 lodge、date 作动词），必须着重强调——对话中加粗+⭐，记录本备注中加"⭐高频"标记，方便用户复习时抓重点。
9. 题目解析环节（2026-10-28 新增）：用户会发"陈述句 + 为什么这个是对的（/错的/Not Given）"来问判断题、选择题等的答案依据。回答要点：定位原文出处 → 讲清同义替换链 → 指出命题陷阱（常识误导、相反事实、未提及）。⚠️ 这类具体题目询问【不记录】到 ielts-vocab-data.md，只做对话讲解；工作流规则本身除外。
10. 同义替换板块（2026-10-28 新增）：独立文件 [[ielts-synonyms]]（同目录 ielts-synonyms.md），按语义分组累积"词汇级"与"题句级（题干↔原文）"同义替换，标注来源标识。讲解生词时带出的同义词、题目解析中发现的题干↔原文替换对，都要追加进去——题目解析本身不入 vocab 档，但其中的替换对要入 synonyms 板块。同一语义组已存在时补进该行，不新开行。
11. GitHub 同步（2026-10-28 设置）：本地记录目录本身是 git 仓库，远程为私有仓库 https://github.com/peppabaoyu/ielts（分支 main）。跟踪文件：ielts-vocab-data.md、ielts-synonyms.md、ielts-vocab-workflow.md；MEMORY.md 不上传。用户说"同步到 GitHub"时：add 这三个文件 → commit → push；用户说在 GitHub 端改过内容时先 `git pull --rebase` 再继续记录。提交身份：peppabaoyu + peppabaoyu@users.noreply.github.com（仓库级配置）。⚠️ token 只存于本机 .git/config，绝不写入记忆文件或笔记内容；token 到期后推送会报 403，需用户提供新 token（更新方式：`git remote set-url origin https://peppabaoyu:新token@github.com/peppabaoyu/ielts.git`）。
