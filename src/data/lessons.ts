import { Lesson } from '../types/curriculum';

export const LESSONS: Lesson[] = [
  {
    id: 'lesson-01-hello',
    number: '01',
    title: '認識 Python 與第一個輸出',
    track: '基礎語法',
    duration: '8 分鐘',
    summary: '學習使用 print() 函式印出文字與數字，認識字串引號與單行註解的撰寫規範。',
    visualizerType: 'none',
    concepts: [
      {
        title: '使用 print() 顯示執行結果',
        explanation:
          'print() 是 Python 最基礎的內建函式，可將括號內的文字（字串）或計算結果輸出到終端機。文字必須用單引號或雙引號包起來。',
        code: 'print("Hello, Python!")\nprint("歡迎來到 PyLab 學院")\nprint(2026)',
      },
      {
        title: '註解與多參數分隔',
        explanation:
          '以 # 開頭的文字是「註解」，Python 執行時會忽略它，專門用來寫給開發者閱讀的說明。print() 也可以同時傳入多個項目，預設會以空白隔開。',
        code: '# 這是一行註解，不會被執行\nprint("總金額：", 350, "元")\nprint("項目", "數量", sep=" | ")',
      },
    ],
    challenge: {
      title: '印出自我介紹名片',
      instructions:
        '請撰寫兩行 print() 程式：\n1. 第一行印出包含「Python」的問候語\n2. 第二行印出數字 100 與文字「分」',
      expectedSummary: '輸出需至少兩行，包含 Python 字樣與 100',
      starterCode: '# 請在下方完成你的第一支 Python 程式\nprint("你好，世界")\n',
      solutionCode: 'print("我正在學習 Python 程式設計！")\nprint(100, "分")',
      hint: '使用 print("...") 印出包含 Python 的句子，再寫第二行 print(100, "分")。',
      validate: (output) => {
        const lines = output.trim().split('\n').filter(Boolean);
        if (lines.length < 2) {
          return { passed: false, message: '請確認至少輸出兩行內容，目前只有 ' + lines.length + ' 行。' };
        }
        if (!output.toLowerCase().includes('python')) {
          return { passed: false, message: '第一段輸出中請包含 "Python" 字樣。' };
        }
        if (!output.includes('100')) {
          return { passed: false, message: '輸出中尚未包含數字 100。' };
        }
        return { passed: true, message: '太棒了！你已成功寫出並執行第一支 Python 程式。' };
      },
    },
  },
  {
    id: 'lesson-02-variables',
    number: '02',
    title: '變數與基本資料型別',
    track: '基礎語法',
    duration: '10 分鐘',
    summary: '掌握變數命名原則與四大核心型別：整數 (int)、浮點數 (float)、字串 (str) 與布林值 (bool)。',
    visualizerType: 'variables',
    concepts: [
      {
        title: '建立變數與動態型別',
        explanation:
          '在 Python 中，使用等號 = 即可將資料放進變數，不需事先宣告型別。變數名稱建議採用小寫字母與底線組合（snake_case）。',
        code: 'student_name = "林小美"\nage = 20\ngpa = 3.85\nis_active = True\n\nprint(student_name, type(student_name))\nprint(age, type(age))',
      },
      {
        title: '型別轉換：int()、float()、str()',
        explanation:
          '文字 "25" 與數字 25 屬於不同型別，不能直接進行數學相加。我們可以使用 int()、float() 或 str() 進行明確轉換。',
        code: 'price_text = "120"\nquantity = 3\ntotal = int(price_text) * quantity\nprint("總價：" + str(total))',
      },
    ],
    challenge: {
      title: '建立商品資料卡',
      instructions:
        '請定義三個變數：item（字串，例如 "機械鍵盤"）、price（整數，設為 2400）、in_stock（布林值 True），最後將這三個變數印出。',
      expectedSummary: '程式需宣告 item、price、in_stock 並印出 2400 與 True',
      starterCode: 'item = "機械鍵盤"\n# 請補齊 price 與 in_stock 變數並印出\n',
      solutionCode:
        'item = "機械鍵盤"\nprice = 2400\nin_stock = True\n\nprint(item)\nprint(price)\nprint(in_stock)',
      hint: '整數不加引號（price = 2400），布林值首字母需大寫（True）。',
      validate: (output, code) => {
        if (!code.includes('item') || !code.includes('price') || !code.includes('in_stock')) {
          return { passed: false, message: '請確認程式中已建立 item、price 與 in_stock 三個變數。' };
        }
        if (!output.includes('2400') || !output.includes('True')) {
          return { passed: false, message: '終端機輸出需包含 2400 與 True。' };
        }
        return { passed: true, message: '通過驗證！你已掌握變數賦值與常見資料型別。' };
      },
    },
  },
  {
    id: 'lesson-03-operators',
    number: '03',
    title: '運算子與 f-string 格式化',
    track: '基礎語法',
    duration: '10 分鐘',
    summary: '運用整數除法 //、取餘數 %、次方 ** 進行數值運算，並用 f-string 組合整齊的輸出字串。',
    visualizerType: 'operators',
    concepts: [
      {
        title: '進階數學運算子',
        explanation:
          '除了加減乘除 (+, -, *, /)，Python 還提供三個非常實用的運算子：//（無條件捨去取商）、%（取餘數）與 **（次方）。',
        code: 'total_minutes = 135\nhours = total_minutes // 60\nminutes = total_minutes % 60\nprint(hours, "小時", minutes, "分鐘")\nprint("2 的 10 次方 =", 2 ** 10)',
      },
      {
        title: 'f-string 字串插值',
        explanation:
          '在字串前加上 f，即可在大括號 {} 內直接放入變數或運算式，也能搭配 :.2f 控制小數位數。',
        code: 'name = "紅茶拿鐵"\nprice = 65\ndiscount = 0.85\nfinal_price = price * discount\nprint(f"{name} 折後價格為 {final_price:.1f} 元")',
      },
    ],
    challenge: {
      title: '計算秒數換算',
      instructions:
        '假設 seconds = 500，請利用 // 與 % 計算出等於幾分幾秒，並使用 f-string 印出「500 秒等於 8 分 20 秒」。',
      expectedSummary: '輸出需為：500 秒等於 8 分 20 秒',
      starterCode: 'seconds = 500\n# 使用 // 和 % 算出 mins 與 rem_secs\n',
      solutionCode:
        'seconds = 500\nmins = seconds // 60\nrem_secs = seconds % 60\nprint(f"{seconds} 秒等於 {mins} 分 {rem_secs} 秒")',
      hint: 'mins = seconds // 60，rem_secs = seconds % 60，再用 f"{seconds} 秒等於 {mins} 分 {rem_secs} 秒"。',
      validate: (output, code) => {
        if (!code.includes('//') || !code.includes('%')) {
          return { passed: false, message: '請使用 // 與 % 運算子來計算分鐘與餘數秒數。' };
        }
        if (!output.includes('8') || !output.includes('20')) {
          return { passed: false, message: '計算結果應包含 8 分與 20 秒，請再檢查運算式。' };
        }
        return { passed: true, message: '計算完全正確！f-string 與整除取餘是實務中最常見的組合。' };
      },
    },
  },
  {
    id: 'lesson-04-conditionals',
    number: '04',
    title: '條件判斷 if / elif / else',
    track: '流程控制',
    duration: '12 分鐘',
    summary: '讓程式依據條件做出不同決策，並理解縮排與邏輯運算子 and / or / not 的運作順序。',
    visualizerType: 'branching',
    concepts: [
      {
        title: '多分支條件結構',
        explanation:
          'if / elif / else 會由上而下依序檢查條件，只要其中一個成立，就會執行該縮排區塊並跳過後續分支。注意條件行尾必須加上冒號 (:)。',
        code: 'score = 84\n\nif score >= 90:\n    grade = "A (優等)"\nelif score >= 60:\n    grade = "B (及格)"\nelse:\n    grade = "C (需補強)"\n\nprint(f"分數 {score} -> 評等 {grade}")',
      },
      {
        title: '複合邏輯條件',
        explanation:
          '使用 and（兩者皆真）、or（任一為真）與 not（反轉真假）來組合複雜的商業判斷條件。',
        code: 'age = 22\nhas_ticket = True\n\nif age >= 18 and has_ticket:\n    print("歡迎入場")\nelse:\n    print("不符合入場資格")',
      },
    ],
    challenge: {
      title: '捷運票價級距判斷',
      instructions:
        '請根據變數 age = 68 撰寫條件判斷：\n• 未滿 12 歲印出 "半價"\n• 65 歲以上（含）印出 "敬老票"\n• 其餘印出 "全票"',
      expectedSummary: '當 age = 68 時，需輸出「敬老票」',
      starterCode: 'age = 68\n\n# 請撰寫 if / elif / else 條件判斷\n',
      solutionCode:
        'age = 68\n\nif age < 12:\n    print("半價")\nelif age >= 65:\n    print("敬老票")\nelse:\n    print("全票")',
      hint: '先判斷 age < 12，接著用 elif age >= 65: 印出 "敬老票"，最後 else 印出 "全票"。',
      validate: (output, code) => {
        if (!code.includes('if') || !code.includes('elif') || !code.includes('else')) {
          return { passed: false, message: '請使用完整的 if / elif / else 結構來處理三種級距。' };
        }
        if (output.trim() !== '敬老票') {
          return { passed: false, message: '當 age = 68 時應輸出「敬老票」，目前輸出為：' + (output.trim() || '(空白)') };
        }
        return { passed: true, message: '邏輯清晰正確！你可以試著更改 age 數值測試其他分支。' };
      },
    },
  },
  {
    id: 'lesson-05-for-loop',
    number: '05',
    title: 'for 迴圈與 range()',
    track: '流程控制',
    duration: '12 分鐘',
    summary: '透過 for 迴圈自動重複執行工作，並搭配 range(start, stop, step) 精準控制次數與步長。',
    visualizerType: 'loop',
    concepts: [
      {
        title: '認識 range() 數列生成器',
        explanation:
          'range(5) 會產生 0, 1, 2, 3, 4（不包含結尾的 5）。若傳入三個參數 range(開始, 結束, 步長)，可以控制起始值與遞增間隔。',
        code: 'for i in range(1, 6):\n    print(f"第 {i} 次報數")\n\nprint("--- 偶數列 ---")\nfor even in range(2, 11, 2):\n    print(even)',
      },
      {
        title: '使用累加器計算總和',
        explanation:
          '搭配一個初始為 0 的累加變數 total，在迴圈內逐次加上新數值，是最常見的資料統計模式。',
        code: 'total = 0\nfor n in range(1, 11):\n    total += n\nprint("1 到 10 總和 =", total)',
      },
    ],
    challenge: {
      title: '計算 1 到 20 的偶數總和',
      instructions:
        '請使用 for 迴圈與 range() 計算 2 + 4 + 6 + ... + 20 的總和，並將結果印出（答案應為 110）。',
      expectedSummary: '利用 for 迴圈計算並印出 110',
      starterCode: 'even_sum = 0\n# 請用 for 迴圈加總 2 到 20 的偶數\n\nprint(even_sum)\n',
      solutionCode: 'even_sum = 0\nfor num in range(2, 21, 2):\n    even_sum += num\nprint(even_sum)',
      hint: 'range(2, 21, 2) 會產生 2, 4, 6 ... 直到 20（因為結尾參數不包含 21）。',
      validate: (output, code) => {
        if (!code.includes('for ')) {
          return { passed: false, message: '請使用 for 迴圈完成計算。' };
        }
        if (!output.includes('110')) {
          return { passed: false, message: '2 到 20 的偶數總和應為 110，請檢查 range() 的結束值是否設為 21。' };
        }
        return { passed: true, message: '成功！你已掌握 range() 的「含頭不含尾」原則與累加技巧。' };
      },
    },
  },
  {
    id: 'lesson-06-while-loop',
    number: '06',
    title: 'while 迴圈與迴圈控制',
    track: '流程控制',
    duration: '12 分鐘',
    summary: '學習在未知執行次數時使用 while 迴圈，並運用 break 提前跳出與 continue 略過當次迭代。',
    visualizerType: 'loop',
    concepts: [
      {
        title: 'while 條件式迴圈',
        explanation:
          '只要條件成立，while 就會持續重複執行。撰寫時務必確保迴圈內有改變條件的動作（例如 count += 1），避免無窮迴圈。',
        code: 'countdown = 3\nwhile countdown > 0:\n    print(f"倒數 {countdown}")\n    countdown -= 1\nprint("發射！")',
      },
      {
        title: 'break 與 continue',
        explanation:
          'break 會立刻終止整個迴圈；continue 則會跳過本次剩下的程式碼，直接進入下一輪檢查。',
        code: 'for num in range(1, 8):\n    if num == 3:\n        continue  # 跳過 3\n    if num == 6:\n        break     # 遇到 6 停止\n    print(num)',
      },
    ],
    challenge: {
      title: '存款複利目標追蹤',
      instructions:
        '初始存款 savings = 1000，每月固定存入 350 元。請用 while 迴圈計算需要幾個月（months）存款才會大於或等於 3000 元，並印出月份數。',
      expectedSummary: '使用 while 迴圈計算出需要 6 個月',
      starterCode:
        'savings = 1000\nmonths = 0\n\n# 當 savings < 3000 時持續存錢\n\nprint(f"需要 {months} 個月達成目標，存款為 {savings} 元")\n',
      solutionCode:
        'savings = 1000\nmonths = 0\n\nwhile savings < 3000:\n    savings += 350\n    months += 1\n\nprint(f"需要 {months} 個月達成目標，存款為 {savings} 元")',
      hint: '在 while savings < 3000: 區塊內執行 savings += 350 與 months += 1。',
      validate: (output, code) => {
        if (!code.includes('while')) {
          return { passed: false, message: '請使用 while 迴圈模擬逐月累積過程。' };
        }
        if (!output.includes('6') || !output.includes('3100')) {
          return { passed: false, message: '從 1000 開始每月加 350，第 6 個月會達到 3100 元，請檢查條件式。' };
        }
        return { passed: true, message: '完美達成！while 迴圈非常適合處理「達成目標為止」的模擬運算。' };
      },
    },
  },
  {
    id: 'lesson-07-lists',
    number: '07',
    title: '串列 List 與切片操作',
    track: '資料結構',
    duration: '14 分鐘',
    summary: '用串列有序儲存多筆資料，練習正負索引存取、切片 [start:end] 及 append()、pop() 修改方法。',
    visualizerType: 'list',
    concepts: [
      {
        title: '索引與切片 (Slicing)',
        explanation:
          '串列索引從 0 開始，-1 代表最後一個元素。使用 [start:end] 可以取出子串列（同樣含頭不含尾）。',
        code: 'langs = ["Python", "Rust", "Go", "TypeScript"]\nprint("第一個：", langs[0])\nprint("最後一個：", langs[-1])\nprint("前兩個：", langs[0:2])',
      },
      {
        title: '動態新增與移除元素',
        explanation:
          'append() 會在串列尾端加入項目；pop() 可移除並回傳指定位置（預設為最後一項）的元素；len() 可取得總長度。',
        code: 'tasks = ["設計原型", "寫單元測試"]\ntasks.append("部署上線")\ncompleted = tasks.pop(0)\nprint("已完成：", completed)\nprint("剩餘待辦：", tasks)',
      },
    ],
    challenge: {
      title: '管理待辦清單與切片',
      instructions:
        '請在串列 scores = [72, 85, 90, 64] 尾端加入 95，然後使用切片取出「前 3 筆成績」並印出該子串列。',
      expectedSummary: '對 scores 使用 append(95) 並印出前 3 筆 [72, 85, 90]',
      starterCode: 'scores = [72, 85, 90, 64]\n# 加入 95 並印出前 3 筆成績\n',
      solutionCode: 'scores = [72, 85, 90, 64]\nscores.append(95)\ntop_three = scores[:3]\nprint("全部成績：", scores)\nprint("前 3 筆：", top_three)',
      hint: '使用 scores.append(95)，接著用 scores[:3] 取出索引 0, 1, 2 的元素。',
      validate: (output, code) => {
        if (!code.includes('.append(')) {
          return { passed: false, message: '請使用 .append() 方法新增 95。' };
        }
        if (!output.includes('[72, 85, 90]')) {
          return { passed: false, message: '輸出尚未顯示切片結果 [72, 85, 90]。' };
        }
        return { passed: true, message: '驗證通過！切片語法是資料分析與文字處理的強大工具。' };
      },
    },
  },
  {
    id: 'lesson-08-dicts',
    number: '08',
    title: '字典 Dictionary 與集合 Set',
    track: '資料結構',
    duration: '14 分鐘',
    summary: '使用鍵值對 (Key-Value) 快速查詢結構化資料，安全運用 .get() 與 .items()，並用 Set 去除重複項目。',
    visualizerType: 'dict',
    concepts: [
      {
        title: '建立與讀取字典',
        explanation:
          '字典使用大括號 {} 與冒號儲存「鍵：值」。若讀取不存在的鍵會引發 KeyError，改用 .get(鍵, 預設值) 可以安全避免錯誤。',
        code: 'user = {"name": "陳大文", "role": "工程師", "level": 3}\nuser["city"] = "台北"\n\nprint("姓名：", user["name"])\nprint("部門：", user.get("dept", "未指派"))\n\nfor k, v in user.items():\n    print(f"{k} -> {v}")',
      },
      {
        title: '集合 Set 自動去重',
        explanation:
          '集合中的元素不會重複，適合用來統計「不重複的訪客名單」或檢查某個元素是否存在。',
        code: 'visitors = ["Amy", "Bob", "Amy", "Cathy", "Bob"]\nunique_visitors = set(visitors)\nprint("不重複人數：", len(unique_visitors))',
      },
    ],
    challenge: {
      title: '更新庫存字典並計算總量',
      instructions:
        '給定庫存字典 inventory = {"apple": 12, "banana": 8}。\n1. 新增 "orange": 15\n2. 將 "apple" 的數量更新為 20\n3. 計算並印出三種水果的總庫存數量（應為 43）。',
      expectedSummary: '更新字典後，印出總庫存數 43',
      starterCode: 'inventory = {"apple": 12, "banana": 8}\n# 更新字典並加總所有數量\n',
      solutionCode:
        'inventory = {"apple": 12, "banana": 8}\ninventory["orange"] = 15\ninventory["apple"] = 20\n\ntotal = sum(inventory.values())\nprint("最新庫存：", inventory)\nprint("總數量：", total)',
      hint: '可直接用 inventory["orange"] = 15 新增項目，再用 sum(inventory.values()) 計算總和。',
      validate: (output, code) => {
        if (!code.includes('orange') || !code.includes('20')) {
          return { passed: false, message: '請確認已新增 orange 並將 apple 更新為 20。' };
        }
        if (!output.includes('43')) {
          return { passed: false, message: '更新後的總庫存應為 43 (20 + 8 + 15)。' };
        }
        return { passed: true, message: '太棒了！你已能熟練使用字典進行資料映射與統計。' };
      },
    },
  },
  {
    id: 'lesson-09-functions',
    number: '09',
    title: '函式設計與回傳值',
    track: '函式與實戰',
    duration: '15 分鐘',
    summary: '使用 def 封裝可重複利用的邏輯，理解參數預設值、return 回傳值與區域變數生命週期。',
    visualizerType: 'function',
    concepts: [
      {
        title: '定義函式與 return',
        explanation:
          'print() 只是把結果顯示在畫面上；return 則是把計算結果交還給呼叫端，讓後續程式可以繼續拿來運算或儲存。',
        code: 'def calc_bmi(weight_kg, height_cm):\n    height_m = height_cm / 100\n    bmi = weight_kg / (height_m ** 2)\n    return round(bmi, 1)\n\nmy_bmi = calc_bmi(68, 175)\nprint("計算結果：", my_bmi)',
      },
      {
        title: '預設參數值',
        explanation:
          '替參數設定預設值後，呼叫端若省略該參數就會自動套用預設值，提升函式彈性。',
        code: 'def apply_discount(price, rate=0.9):\n    return round(price * rate)\n\nprint("一般折扣：", apply_discount(1000))\nprint("VIP 折扣：", apply_discount(1000, 0.75))',
      },
    ],
    challenge: {
      title: '撰寫攝氏轉華氏函式',
      instructions:
        '請定義一個名為 c_to_f(celsius) 的函式，套用公式 celsius * 9 / 5 + 32 並用 return 回傳結果。最後呼叫並印出 c_to_f(25) 的結果（應為 77 或 77.0）。',
      expectedSummary: '定義 def c_to_f(celsius) 並回傳並印出 77.0',
      starterCode: '# 請定義 c_to_f 函式\n\n\nprint(c_to_f(25))\n',
      solutionCode: 'def c_to_f(celsius):\n    return celsius * 9 / 5 + 32\n\nresult = c_to_f(25)\nprint(result)',
      hint: '函式內寫 return celsius * 9 / 5 + 32，記得不要在函式內只寫 print 而忘了 return。',
      validate: (output, code) => {
        if (!code.includes('def c_to_f') || !code.includes('return')) {
          return { passed: false, message: '請使用 def c_to_f(celsius): 並在函式內使用 return 回傳結果。' };
        }
        if (!output.includes('77')) {
          return { passed: false, message: 'c_to_f(25) 的結果應為 77.0。' };
        }
        return { passed: true, message: '函式設計非常標準！善用 return 能讓程式結構更模組化。' };
      },
    },
  },
  {
    id: 'lesson-10-strings-builtins',
    number: '10',
    title: '字串處理與常用內建函式',
    track: '函式與實戰',
    duration: '12 分鐘',
    summary: '處理真實文字資料：strip() 去除空白、split() 切割字串、join() 合併序列與 sorted() 排序。',
    visualizerType: 'none',
    concepts: [
      {
        title: '文字清理與切割重組',
        explanation:
          '從表單或 CSV 讀取資料時，常會有多餘空白或逗號分隔。strip()、split() 與 join() 是文字資料清理的黃金三劍客。',
        code: 'raw = "  Python, JavaScript, Go  "\ncleaned = raw.strip()\ntags = cleaned.split(", ")\nprint("串列：", tags)\nprint("重新組合：", " / ".join(tags))',
      },
      {
        title: 'sorted() 與統計函式',
        explanation:
          'sorted() 會回傳一個全新的排序後串列，不會破壞原本串列的順序；reverse=True 可改為由大到小排列。',
        code: 'temps = [24, 19, 31, 27]\nprint("由高到低：", sorted(temps, reverse=True))\nprint("最高溫：", max(temps), "最低溫：", min(temps))',
      },
    ],
    challenge: {
      title: '清理並排序關鍵字標籤',
      instructions:
        '給定 raw_tags = "  data, ai, python, web  "。\n請先去除前後空白，用 ", " 切割成串列，轉為全部大寫或排序後，使用 " | " 串接印出（例如 "ai | data | python | web"）。',
      expectedSummary: '輸出排序並以 | 分隔的文字：ai | data | python | web',
      starterCode: 'raw_tags = "  data, ai, python, web  "\n# 清理空白、切割、排序並用 " | " 合併\n',
      solutionCode:
        'raw_tags = "  data, ai, python, web  "\nitems = raw_tags.strip().split(", ")\nsorted_items = sorted(items)\nprint(" | ".join(sorted_items))',
      hint: '步驟為：raw_tags.strip().split(", ") -> sorted(...) -> " | ".join(...)。',
      validate: (output) => {
        if (!output.includes('ai | data | python | web')) {
          return { passed: false, message: '預期輸出為「ai | data | python | web」，請檢查切割符號與排序步驟。' };
        }
        return { passed: true, message: '資料清理任務完成！這正是實務解析 CSV 與使用者輸入的核心流程。' };
      },
    },
  },
  {
    id: 'lesson-11-comprehensions-errors',
    number: '11',
    title: '串列生成式與錯誤處理',
    track: '函式與實戰',
    duration: '14 分鐘',
    summary: '寫出地道簡潔的 List Comprehension，並學會用 try / except 攔截執行時期例外，提升程式強健度。',
    visualizerType: 'none',
    concepts: [
      {
        title: '簡潔的串列生成式 (List Comprehension)',
        explanation:
          '將原本需要三行 for + append 的轉換寫成一行 [運算式 for 變數 in 序列 if 條件]，可讀性高且執行效率佳。',
        code: 'nums = [1, 2, 3, 4, 5, 6]\nsquares = [n ** 2 for n in nums if n % 2 == 0]\nprint("偶數平方：", squares)',
      },
      {
        title: '使用 try / except 優雅處理錯誤',
        explanation:
          '當使用者輸入格式錯誤或除以零時，try / except 能捕捉錯誤並給予友善提示，不讓整個程式突然崩潰。',
        code: 'def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return "錯誤：除數不可為 0"\n\nprint(safe_divide(10, 2))\nprint(safe_divide(10, 0))',
      },
    ],
    challenge: {
      title: '篩選及格分數並加分',
      instructions:
        '給定原始分數 raw_scores = [45, 78, 52, 91, 60]。請使用「串列生成式」選出大於等於 60 分的分數，並將這些分數各加 5 分後印出（結果應為 [83, 96, 65]）。',
      expectedSummary: '使用串列生成式產出並印出 [83, 96, 65]',
      starterCode: 'raw_scores = [45, 78, 52, 91, 60]\n# 請用一行串列生成式完成篩選與加分\n',
      solutionCode:
        'raw_scores = [45, 78, 52, 91, 60]\nadjusted = [s + 5 for s in raw_scores if s >= 60]\nprint(adjusted)',
      hint: '格式為 [s + 5 for s in raw_scores if s >= 60]。',
      validate: (output, code) => {
        if (!code.includes('[') || !code.includes('for ') || !code.includes('if ')) {
          return { passed: false, message: '請嘗試使用含 if 條件的串列生成式 [ ... for ... if ... ]。' };
        }
        if (!output.includes('[83, 96, 65]')) {
          return { passed: false, message: '預期輸出為 [83, 96, 65]，請檢查篩選條件是否為 >= 60。' };
        }
        return { passed: true, message: '寫得非常地道 (Pythonic)！串列生成式是進階 Python 開發的必備語法。' };
      },
    },
  },
  {
    id: 'lesson-12-capstone',
    number: '12',
    title: '綜合實戰：簡易成績統計系統',
    track: '函式與實戰',
    duration: '18 分鐘',
    summary: '整合字典、串列、迴圈與函式設計，實作可計算班級平均、最高分與及格人數的完整統計報告。',
    visualizerType: 'none',
    concepts: [
      {
        title: '結構化資料設計',
        explanation:
          '在實際專案中，我們常將多筆紀錄整理成字典或串列，並透過專職函式處理計算邏輯，再統一格式化輸出報告。',
        code: 'records = {"小華": 88, "小美": 94, "阿哲": 56}\n\naverage = sum(records.values()) / len(records)\npassed = [name for name, s in records.items() if s >= 60]\n\nprint(f"平均分：{average:.1f}")\nprint("及格名單：", passed)',
      },
    ],
    challenge: {
      title: '完成班級成績統計函式',
      instructions:
        '給定 class_scores = {"Alice": 92, "Bob": 58, "Charlie": 76, "Diana": 84}。\n請撰寫函式 analyze_scores(data)，回傳或印出：\n1. 全班平均分（應為 77.5）\n2. 及格（>= 60）人數（應為 3 人）\n3. 最高分（應為 92）',
      expectedSummary: '輸出包含平均 77.5、及格人數 3 與最高分 92',
      starterCode:
        'class_scores = {"Alice": 92, "Bob": 58, "Charlie": 76, "Diana": 84}\n\ndef analyze_scores(data):\n    # 請計算平均分、及格人數與最高分\n    pass\n\nanalyze_scores(class_scores)\n',
      solutionCode:
        'class_scores = {"Alice": 92, "Bob": 58, "Charlie": 76, "Diana": 84}\n\ndef analyze_scores(data):\n    values = data.values()\n    avg = sum(values) / len(values)\n    passed_count = len([s for s in values if s >= 60])\n    highest = max(values)\n    print(f"平均分數：{avg:.1f}")\n    print(f"及格人數：{passed_count} 人")\n    print(f"最高分數：{highest}")\n\nanalyze_scores(class_scores)',
      hint: '可透過 data.values() 取得所有分數，搭配 sum()、len()、max() 與串列生成式統計及格人數。',
      validate: (output, code) => {
        if (!code.includes('def analyze_scores')) {
          return { passed: false, message: '請保留並實作 analyze_scores 函式。' };
        }
        if (!output.includes('77.5') || !output.includes('3') || !output.includes('92')) {
          return { passed: false, message: '輸出需同時包含平均分 77.5、及格人數 3 以及最高分 92。' };
        }
        return { passed: true, message: '恭喜完課！你已經具備獨立撰寫 Python 資料處理與邏輯程式的能力。' };
      },
    },
  },
];
