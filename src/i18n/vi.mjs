/**
 * Tiếng Việt (vi)
 * Ghi đè lên en.mjs — khóa nào không định nghĩa sẽ tự động dùng bản tiếng Anh.
 * Các khóa cố ý giữ nguyên tiếng Anh: home.hero.line1/line2, home.backtest.lines,
 * home.tech.words, home.final.*, about.philosophyNo/philosophyYes (typography thương hiệu).
 */
export default {
  meta: {
    brandLine: 'Algorithmic Trading Lab',
    defaultDesc:
      'TYO là một phòng nghiên cứu giao dịch thuật toán độc lập. Chúng tôi nghiên cứu, thiết kế và kiểm thử Expert Advisor cho MetaTrader 5 bằng quy trình phát triển có AI hỗ trợ, phân tích định lượng và backtest nghiêm ngặt.',
  },

  nav: {
    home: 'Trang chủ',
    ea: 'Expert Advisor',
    history: 'Lịch sử phát triển',
    technology: 'Công nghệ',
    lab: 'Backtest Lab',
    about: 'Về TYO',
    contact: 'Liên hệ',
  },

  ui: {
    menu: 'Menu',
    close: 'Đóng',
    language: 'Ngôn ngữ',
    selectLanguage: 'Chọn ngôn ngữ',
    skipToContent: 'Bỏ qua tới nội dung',
    scroll: 'Cuộn',
    backToTop: 'Lên đầu trang',
    exploreEAs: 'Xem EA của chúng tôi',
    ourStory: 'Câu chuyện phát triển',
    viewOnMql5: 'Xem trên MQL5',
    mql5Profile: 'Hồ sơ MQL5',
    downloadEA: 'Tải EA',
    readMore: 'Đọc tiếp',
    viewAll: 'Xem tất cả',
    viewDetail: 'Xem chi tiết',
    free: 'Miễn phí',
    paid: 'Trả phí',
    comingSoon: 'Sắp ra mắt',
    inDevelopment: 'Đang phát triển',
    released: 'Đã phát hành',
    dataPending: 'Dữ liệu chờ công bố',
    dataPendingNote:
      'Chúng tôi chỉ công bố những con số đã được kiểm chứng. Phần này sẽ xuất hiện khi báo cáo kiểm thử tương ứng hoàn tất.',
    notPublished: 'Chưa công bố',
    updated: 'Cập nhật',
    published: 'Công bố',
    version: 'Phiên bản',
    back: 'Quay lại',
    externalLink: 'Mở trong tab mới',
    playVideo: 'Phát video',
    pauseVideo: 'Tạm dừng video',
    reduceMotionNote: 'Hiệu ứng chuyển động đã được giảm theo thiết lập hệ thống của bạn.',
  },

  home: {
    hero: {
      sub: 'Nghiên cứu có AI hỗ trợ. Logic định lượng. Thực thi tự động.',
      eyebrow: 'Phòng nghiên cứu giao dịch thuật toán độc lập',
    },
    intro: {
      eyebrow: 'Triết lý',
      h1: 'Chúng tôi xây dựng thuật toán,',
      h2: 'không đưa ra lời tiên đoán.',
      body1:
        'Chúng tôi không tuyên bố biết thị trường sẽ đi về đâu. Không ai biết cả. Thứ có thể thiết kế được là quy trình bao quanh sự bất định đó.',
      body2:
        'Dữ liệu. Xác suất. Quy tắc. Kiểm soát rủi ro. Thực thi tự động. TYO đối diện thị trường bằng thuật toán thay vì cảm xúc, và xem mọi kết quả là bằng chứng quan sát, không phải sự chứng minh.',
      pillars: [
        { k: 'Dữ liệu', v: 'Từ quan sát, không phải giả định' },
        { k: 'Xác suất', v: 'Là phân phối, không phải điều chắc chắn' },
        { k: 'Quy tắc', v: 'Được viết ra trước khi vào lệnh' },
        { k: 'Rủi ro', v: 'Được xác định trước khi mở vị thế' },
        { k: 'Thực thi', v: 'Tự động và lặp lại được' },
      ],
    },
    stats: {
      eyebrow: 'Cộng đồng',
      h: 'Được trader trên toàn thế giới sử dụng.',
      body:
        'Các EA miễn phí của chúng tôi được phát hành qua MQL5, sàn ứng dụng chính thức của MetaTrader. Mỗi lượt tải là một trader độc lập chủ động chọn chạy mã của chúng tôi.',
      labels: {
        downloads: 'Lượt tải EA toàn cầu',
        countries: 'Quốc gia tiếp cận',
        releases: 'Số EA đã phát hành',
        backtests: 'Số lần backtest đã chạy',
        years: 'Số năm nghiên cứu',
      },
      source: 'Nguồn: sàn MQL5, tổng lượt tải EA miễn phí.',
    },
    global: {
      eyebrow: 'Cộng đồng toàn cầu',
      h1: 'Xây dựng tại Nhật Bản.',
      h2: 'Kiểm chứng bởi trader khắp thế giới.',
      body:
        'TYO được phát triển tại Tokyo, nhưng mã của chúng tôi chạy trên các terminal ở Ấn Độ, Thái Lan, Indonesia, Việt Nam, Trung Quốc và nhiều nơi khác. Broker khác nhau. Spread khác nhau. Giờ giao dịch khác nhau. Sự đa dạng đó là bài kiểm tra áp lực trung thực nhất mà một thuật toán có thể nhận được.',
      legend: 'Khu vực cộng đồng hoạt động',
    },
    ai: {
      eyebrow: 'AI Accelerated Development',
      h1: 'AI không phải là chiến lược.',
      h2: 'AI là bộ tăng tốc.',
      body:
        'Chúng tôi dùng AI ở những khâu thực sự nhân đôi hiệu suất kỹ thuật: đọc dữ liệu, phác thảo mã, dựng cấu trúc kiểm thử, tóm tắt kết quả, khảo sát không gian tham số. Bản thân logic giao dịch vẫn tường minh, đọc được và kiểm tra được.',
      note:
        'AI không dự đoán thị trường, và không kết quả mô hình nào trên trang này được trình bày như một dự báo giá tương lai.',
      items: [
        { k: 'Hỗ trợ viết mã', v: 'Triển khai và tái cấu trúc MQL5 nhanh hơn' },
        { k: 'Nghiên cứu', v: 'Rà soát tài liệu, cấu trúc thị trường và hành vi giá' },
        { k: 'Phân tích dữ liệu', v: 'Xử lý dữ liệu tick và nến ở quy mô lớn' },
        { k: 'Khảo sát tham số', v: 'Tìm kiếm có hệ thống thay vì phỏng đoán' },
        { k: 'Kiểm thử', v: 'Ma trận kiểm thử tự động theo nhiều điều kiện' },
        { k: 'Tài liệu hóa', v: 'Hồ sơ kiểm thử nhất quán và tái lập được' },
      ],
    },
    algorithm: {
      eyebrow: 'From Idea to Algorithm',
      body:
        'Một quan sát trên thị trường chưa phải là chiến lược. Nó chỉ trở thành chiến lược sau khi vượt qua bước định nghĩa, định lượng, triển khai và kiểm thử.',
      steps: [
        { n: '01', k: 'Dữ liệu thị trường', v: 'Giá, khối lượng và chuỗi thời gian thô' },
        { n: '02', k: 'Định lượng', v: 'Chuyển hành vi thành điều kiện đo được' },
        { n: '03', k: 'Logic', v: 'Quy tắc vào, ra, khối lượng và rủi ro' },
        { n: '04', k: 'Mã nguồn', v: 'Triển khai MQL5 mang tính tất định' },
        { n: '05', k: 'Thuật toán', v: 'Một hệ thống giao dịch hoàn chỉnh, kiểm thử được' },
        { n: '06', k: 'Expert Advisor', v: 'Thực thi tự động trên MetaTrader 5' },
      ],
    },
    ea: {
      eyebrow: 'Expert Advisors',
      h: 'Những hệ thống chúng tôi đã phát hành.',
      body:
        'Mỗi Expert Advisor đều có tài liệu về ý tưởng, logic, mô hình rủi ro và điều kiện kiểm thử. Không hộp đen, không có kết quả nào không giải thích được.',
      cta: 'Xem tất cả Expert Advisor',
    },
    backtest: {
      eyebrow: 'Backtest Lab',
      body:
        'Phần lớn ý tưởng đều thất bại. Đó chính là điểm mấu chốt. Backtest không phải tài liệu bán hàng — nó là dụng cụ đo cho biết ý tưởng nào xứng đáng được đầu tư thêm thời gian.',
      cta: 'Vào Backtest Lab',
    },
    history: {
      eyebrow: 'Development History',
      h: 'Mỗi EA đều bắt đầu từ một câu hỏi.',
      questions: [
        'Hành vi này có định lượng được không?',
        'Rủi ro này có kiểm soát được không?',
        'Logic này có sống sót qua các điều kiện thị trường khác nhau không?',
      ],
      body: 'Rồi chúng tôi kiểm thử. Kiểm thử lại. Và xây lại từ đầu.',
      cta: 'Đọc dòng thời gian phát triển',
    },
    tech: {
      eyebrow: 'Technology',
      h1: 'Thị trường tồn tại trong xác suất,',
      h2: 'không phải trong sự chắc chắn.',
      body:
        'Chúng tôi mượn ngôn ngữ của lý thuyết xác suất — phân phối, bất định, sự chồng chập của các kết cục — làm triết lý thiết kế, không phải làm cỗ máy dự đoán. Một lệnh giao dịch là một vị trí bên trong phân phối, không bao giờ là một kết quả đã biết.',
      cta: 'Khám phá công nghệ',
    },
  },

  ea: {
    score: {
      title: 'TYO SCORE',
      insufficient: 'Không đủ dữ liệu',
      note: 'Thước đo mức độ bằng chứng của backtest này — không phải dự báo kết quả tương lai. Xem mô hình chấm điểm để biết cách tính từng thành phần.',
      capped: 'Tổng phụ {raw}, bị giới hạn ở {cap} vì sụt giảm tối đa đạt {dd}. Không mức sinh lời nào bù đắp được mức sụt giảm đó.',
      bands: {
        high: 'Bằng chứng vững',
        mid: 'Bằng chứng vừa phải',
        low: 'Hạn chế',
        weak: 'Yếu',
        'insufficient-data': 'Chờ',
      },
      parts: {
        profitability: 'Khả năng sinh lời',
        drawdownControl: 'Kiểm soát sụt giảm',
        consistency: 'Tính nhất quán',
        sampleSize: 'Cỡ mẫu',
        robustness: 'Độ bền',
      },
    },
    charts: {
      year: 'Năm',
      return: 'Lợi nhuận',
      yearTotal: 'Cả năm',
      equityCaption: 'Số dư tài khoản trong suốt backtest. Đường đứt nét là đỉnh lũy kế.',
      equityAria: 'Đường số dư tài khoản, {period}',
      heatAria: 'Lợi nhuận theo tháng và năm, phần trăm của số dư đầu tháng',
      heatLegend: 'Mỗi ô là lợi nhuận tháng đó tính theo phần trăm số dư đầu tháng. Xanh là lãi, đỏ là lỗ. Ô trống là tháng không có lệnh đóng.',
    },
    drawdown: {
      reported: 'Sụt giảm tối đa theo báo cáo',
      closedBasis: 'Sụt giảm theo lệnh đã đóng',
      worstWindow: 'Giai đoạn tệ nhất',
      recovered: 'Hồi phục',
      days: '{n} ngày',
      maxLossStreak: 'Chuỗi thua dài nhất',
      balanceCaveat: 'Báo cáo này tính sụt giảm trên cơ sở số dư, chỉ đếm lệnh đã đóng. Vị thế đang lỗ chưa xuất hiện cho đến khi đóng, nên mức sụt thực tế từ đỉnh lớn hơn con số trên.',
    },
    tradeStats: {
      direction: 'Hướng',
      outcome: 'Kết quả',
      size: 'Quy mô',
      longTrades: 'Lệnh mua',
      shortTrades: 'Lệnh bán',
      closedTrades: 'Lệnh đã đóng',
      winRate: 'Tỷ lệ thắng',
      lossRate: 'Tỷ lệ thua',
      maxWinStreak: 'Chuỗi thắng dài nhất',
      maxLossStreak: 'Chuỗi thua dài nhất',
      avgWin: 'Lãi trung bình',
      avgLoss: 'Lỗ trung bình',
      largestWin: 'Lãi lớn nhất',
      largestLoss: 'Lỗ lớn nhất',
      payoffRatio: 'Tỷ lệ payoff',
      unitNote: 'Số tiền hiển thị theo đơn vị tiền tệ của tài khoản thử nghiệm, điều mà báo cáo này không nêu. Tỷ lệ và số lượng không bị ảnh hưởng.',
    },
    risk2: {
      warnTitle: 'Sụt giảm cao',
      warnBody: 'Hệ thống này sụt {dd} từ đỉnh trong quá trình kiểm thử. Mức sụt đó chỉ vượt qua được với vốn và thời gian nắm giữ tương xứng. Hãy đọc phần công bố rủi ro trước khi cân nhắc.',
      observedTitle: 'Quan sát trong backtest',
      observedLead: 'Đo từ bản ghi giao dịch, không phải tuyên bố của nhà phát triển.',
      obsMaxConcurrent: 'Số vị thế mở đồng thời tối đa',
      obsStacked: 'Lệnh mở khi vị thế khác còn mở',
      obsStopLossShare: 'Đóng bằng cắt lỗ',
      obsWorstStreak: 'Chuỗi thua dài nhất',
      declaredTitle: 'Nhà phát triển công bố',
      declaredPending: 'Chưa công bố. Hành vi martingale, lưới, trung bình giá và tăng khối lượng sẽ được nêu tại đây khi có tài liệu.',
      martingale: 'Martingale',
      grid: 'Lưới',
      averaging: 'Trung bình giá',
      positionScaling: 'Tăng khối lượng',
      stopLoss: 'Cắt lỗ',
      maxPositions: 'Số vị thế tối đa',
    },
    transparency: {
      note: 'Mọi con số trên trang này đến từ báo cáo MetaTrader Strategy Tester của hệ thống. Không mô hình hóa, không làm mượt, không ước lượng. Trường nào báo cáo không nêu thì để trống.',
    },
    researchStatus: {
      live: 'Đang chạy',
      research: 'Nghiên cứu',
      experimental: 'Thử nghiệm',
      development: 'Đang phát triển',
      archived: 'Lưu trữ',
    },
    sections: {
      overview: 'Tổng quan',
      architecture: 'Kiến trúc chiến lược',
      performance: 'Tóm tắt hiệu suất',
      equity: 'Đường vốn',
      drawdown: 'Phân tích sụt giảm',
      monthly: 'Lợi nhuận theo tháng',
      yearly: 'Hiệu suất theo năm',
      tradeStats: 'Thống kê giao dịch',
      riskProfile: 'Hồ sơ rủi ro',
      parameters: 'Tham số',
      story: 'Câu chuyện phát triển',
      versions: 'Lịch sử phiên bản',
      transparency: 'Minh bạch nghiên cứu',
      disclaimer: 'Miễn trừ trách nhiệm',
    },
    pending: {
      story: 'Câu chuyện phát triển của hệ thống này chưa được công bố.',
      architecture: 'Kiến trúc chiến lược của hệ thống này chưa được công bố.',
    },
    index: {
      eyebrow: 'Expert Advisors',
      lead:
        'Các hệ thống giao dịch tự động được xây dựng cho MetaTrader 5 và phát hành qua MQL5. Mỗi hệ thống bên dưới đều nêu rõ logic sử dụng, rủi ro chấp nhận và điều kiện đã kiểm thử.',
      empty: 'Chưa có Expert Advisor nào được công bố. Bản phát hành mới sẽ xuất hiện ở đây đầu tiên.',
      filterAll: 'Tất cả',
      count: 'hệ thống',
    },
    labels: {
      market: 'Thị trường',
      symbol: 'Cặp / Mã',
      timeframe: 'Khung thời gian',
      strategy: 'Loại chiến lược',
      risk: 'Mức rủi ro',
      version: 'Phiên bản',
      releaseDate: 'Ngày phát hành',
      price: 'Hình thức cung cấp',
      platform: 'Nền tảng',
      minDeposit: 'Vốn tối thiểu đề xuất',
      accountType: 'Loại tài khoản',
      leverage: 'Đòn bẩy',
      vps: 'VPS',
      status: 'Trạng thái',
    },
    riskDerivedNote: 'Suy ra từ mức sụt giảm tối đa trong báo cáo kiểm thử, không phải do nhà phát triển công bố.',
    risk: { low: 'Thấp', medium: 'Trung bình', high: 'Cao', variable: 'Tùy cấu hình' },
    detail: {
      overview: 'Tổng quan',
      concept: 'Ý tưởng',
      strategy: 'Chiến lược',
      logic: 'Logic',
      riskManagement: 'Quản trị rủi ro',
      backtest: 'Backtest',
      video: 'Video backtest',
      parameters: 'Tham số',
      environment: 'Môi trường khuyến nghị',
      history: 'Lịch sử phát triển',
      versions: 'Lịch sử phiên bản',
      download: 'Tải về',
      disclaimer: 'Miễn trừ trách nhiệm',
      paramName: 'Tham số',
      paramDefault: 'Mặc định',
      paramDesc: 'Mô tả',
      versionCol: 'Phiên bản',
      dateCol: 'Ngày',
      changeCol: 'Thay đổi',
      downloadBody:
        'Expert Advisor này được phát hành qua MQL5, sàn ứng dụng chính thức của MetaTrader. Việc tải về, cập nhật và đánh giá đều diễn ra trên nền tảng đó.',
      backToList: 'Tất cả Expert Advisor',
      nextEa: 'Hệ thống tiếp theo',
    },
    metrics: {
      title: 'Tóm tắt backtest',
      period: 'Giai đoạn backtest',
      initialDeposit: 'Vốn ban đầu',
      netProfit: 'Lợi nhuận ròng',
      maxDrawdown: 'Sụt giảm tối đa',
      profitFactor: 'Profit Factor',
      totalTrades: 'Tổng số lệnh',
      winRate: 'Tỷ lệ thắng',
      recoveryFactor: 'Recovery Factor',
      expectedPayoff: 'Kỳ vọng mỗi lệnh',
      sharpe: 'Tỷ số Sharpe',
      broker: 'Broker / Máy chủ',
      spread: 'Spread',
      commission: 'Phí hoa hồng',
      modeling: 'Phương pháp mô phỏng',
      dataSource: 'Nguồn dữ liệu',
      quality: 'Chất lượng mô phỏng',
      conditions: 'Điều kiện kiểm thử',
      curveAlt: 'Đường số dư và vốn chủ sở hữu từ báo cáo kiểm thử',
      curveCaption: 'Đường số dư / vốn chủ sở hữu xuất trực tiếp từ báo cáo Strategy Tester.',
      ddBasis: 'Cơ sở tính sụt giảm',
      ddBasis_equity: 'Vốn chủ sở hữu (gồm vị thế đang mở)',
      ddBasis_balance: 'Số dư (chỉ lệnh đã đóng)',
    },
  },

  history: {
    eyebrow: 'Development History',
    lead:
      'Đây không phải lịch sử công ty. Đây là cách một hệ thống giao dịch thực sự được xây dựng — bao gồm cả những phần đã không hiệu quả.',
    processTitle: 'Vòng lặp chúng tôi chạy trên mọi hệ thống',
    failureTitle: 'Thất bại cũng là một phần của hồ sơ',
    failureBody:
      'Một thương hiệu nghiên cứu chỉ khoe chiến thắng thực chất là thương hiệu tiếp thị. Chúng tôi liệt kê các mô hình bị loại bỏ, logic phải viết lại và giả định bị từ bỏ, bởi chúng chính là lý do những hệ thống còn sống sót tồn tại.',
    milestonesTitle: 'Các cột mốc tiêu biểu',
    stage: 'Giai đoạn',
  },

  technology: {
    eyebrow: 'Technology',
    lead:
      'Công nghệ và tư duy đằng sau mọi hệ thống của TYO. Ở đây không có phép màu độc quyền — chỉ là kỷ luật kỹ thuật tiêu chuẩn được áp dụng nhất quán cho phần mềm giao dịch.',
    aiTitle: 'Trí tuệ nhân tạo',
    aiLead:
      'Tại TYO, AI là bộ tăng tốc phát triển, không phải nhà tiên tri. Nó rút ngắn khoảng cách từ một ý tưởng đến một bản triển khai kiểm thử được.',
    aiWarning:
      'Chúng tôi không dùng AI để dự đoán giá, và không trình bày bất kỳ đầu ra mô hình nào như một dự báo về hướng đi của thị trường.',
    quantumTitle: 'Xác suất, không phải sự chắc chắn',
    quantumLead:
      'Ngôn ngữ thị giác và khái niệm của chúng tôi đến từ lý thuyết xác suất — phân phối, bất định, các kết cục chồng chập, hệ hạt. Nó định hình cách chúng tôi thiết kế và trình bày kết quả. Đó là một triết lý khiêm nhường trước tương lai, không phải tuyên bố về khả năng tiên đoán.',
    quantumPoints: [
      { k: 'Xác suất', v: 'Mỗi lệnh là một lần lấy mẫu từ một phân phối.' },
      { k: 'Bất định', v: 'Khoảng tin cậy, không phải mục tiêu giá.' },
      { k: 'Phân phối', v: 'Đánh giá hình dạng của kết quả, không phải một kết quả.' },
      { k: 'Phương sai', v: 'Sụt giảm vốn là đặc tính thiết kế, không phải tai nạn.' },
    ],
    csTitle: 'Hệ thống giao dịch là phần mềm.',
    csTitle2: 'Phần mềm phải được kỹ thuật hóa.',
    csLead:
      'Một Expert Advisor là chương trình thời gian thực xử lý tiền thật dưới độ trễ, thông tin không đầy đủ và các tình huống biên khắc nghiệt. Chúng tôi đối xử với nó như phần mềm chạy thật.',
    csItems: [
      { k: 'Thuật toán', v: 'Quy trình ra quyết định tường minh, đọc được' },
      { k: 'Logic', v: 'Điều kiện tất định, không có trạng thái ẩn' },
      { k: 'Trạng thái', v: 'Vị thế, lệnh và khôi phục sau khi mất kết nối' },
      { k: 'Thực thi', v: 'Xử lý trượt giá, báo giá lại và khớp một phần' },
      { k: 'Độ trễ', v: 'Xử lý tick mà không làm treo terminal' },
      { k: 'Dữ liệu', v: 'Lịch sử cấp tick với chất lượng được ghi rõ' },
      { k: 'Tự động hóa', v: 'Quy trình kiểm thử và phát hành tái lập được' },
    ],
    stackTitle: 'Công nghệ & chuyên môn',
    stack: [
      { k: 'MetaTrader 5', v: 'Nền tảng mục tiêu để thực thi và kiểm thử' },
      { k: 'MQL5', v: 'Ngôn ngữ triển khai cho mọi hệ thống đã phát hành' },
      { k: 'Strategy Tester', v: 'Backtest cấp tick và tối ưu hóa' },
      { k: 'Phân tích định lượng', v: 'Đánh giá kết quả bằng thống kê' },
      { k: 'Nghiên cứu Machine Learning', v: 'Chỉ ở giai đoạn nghiên cứu thăm dò' },
      { k: 'Quản trị rủi ro', v: 'Khối lượng vị thế, mức phơi nhiễm và thiết kế điểm dừng' },
      { k: 'Tự động hóa', v: 'Ma trận kiểm thử và sinh báo cáo bằng script' },
      { k: 'Version Control', v: 'Mọi bản phát hành đều truy vết được về mã nguồn' },
    ],
  },

  lab: {
    eyebrow: 'Backtest Lab',
    lead:
      'Ghi chép nghiên cứu, báo cáo kiểm thử và thí nghiệm. Công bố đúng như nó vốn có — kể cả những lần kết thúc bằng một giả thuyết bị bác bỏ.',
    empty: 'Những ghi chép nghiên cứu đầu tiên đang được chuẩn bị công bố.',
    labels: {
      date: 'Ngày',
      ea: 'Hệ thống',
      market: 'Thị trường',
      period: 'Giai đoạn kiểm thử',
      hypothesis: 'Giả thuyết',
      method: 'Phương pháp',
      result: 'Kết quả',
      conclusion: 'Kết luận',
      type: 'Loại',
      readingTime: 'phút đọc',
    },
    types: {
      backtestReport: 'Báo cáo backtest',
      optimization: 'Thí nghiệm tối ưu hóa',
      parameterStudy: 'Nghiên cứu tham số',
      marketResearch: 'Nghiên cứu thị trường',
      comparison: 'So sánh EA',
      versionTest: 'Kiểm thử phiên bản',
    },
    backToList: 'Tất cả ghi chép nghiên cứu',
  },

  about: {
    eyebrow: 'About TYO',
    lead:
      'TYO là một nhóm độc lập nhỏ tại Nhật Bản xây dựng các hệ thống giao dịch tự động. Trước hết chúng tôi là kỹ sư và người làm nghiên cứu, và chúng tôi công bố công việc của mình để nó được đánh giá bằng tài liệu chứ không phải bằng lời hứa.',
    whoTitle: 'Chúng tôi là ai',
    whoBody:
      'Một nhóm độc lập gọn nhẹ — không phải quỹ, không phải broker, không phải dịch vụ tín hiệu. Chúng tôi kết hợp kỹ thuật phần mềm, phát triển có AI hỗ trợ, nghiên cứu định lượng và giao dịch thuật toán để thiết kế, kiểm thử và phát hành Expert Advisor cho MetaTrader 5.',
    whoNote:
      'Chúng tôi cố ý không tự trình bày mình lớn hơn thực tế. Giá trị nằm ở phương pháp và tài liệu, không nằm ở quy mô tổ chức.',
    philosophyTitle: 'Triết lý của chúng tôi',
    philosophyBody:
      'Ai cũng có thể đăng một đường cong vốn. Rất ít người chịu công bố kèm theo điều kiện tạo ra nó, những phiên bản đã thất bại trước đó, và những rủi ro nó mang theo. Khác biệt đó chính là toàn bộ thương hiệu này.',
    principlesTitle: 'Cách chúng tôi làm việc',
    principles: [
      { k: 'Ghi rõ điều kiện', v: 'Một kết quả không kèm điều kiện kiểm thử thì không phải là kết quả.' },
      { k: 'Công bố cả thất bại', v: 'Những mô hình bị loại bỏ giải thích cho mô hình còn lại.' },
      { k: 'Không bao giờ bảo đảm kết quả', v: 'Không hệ thống nào làm được; thương hiệu nào tuyên bố ngược lại là đang bán thứ khác.' },
      { k: 'Giữ logic đọc được', v: 'Nếu không giải thích được vì sao vào lệnh, chúng tôi không phát hành.' },
      { k: 'Tôn trọng rủi ro trước', v: 'Sụt giảm vốn được thiết kế trước khi đo lợi nhuận.' },
    ],
    contactCta: 'Liên hệ với chúng tôi',
  },

  contact: {
    eyebrow: 'Contact',
    lead:
      'Câu hỏi về một hệ thống, một báo cáo kiểm thử, hoặc hợp tác. Việc tải về, cập nhật và hỗ trợ sản phẩm được xử lý qua MQL5.',
    mql5Title: 'MQL5',
    mql5Body:
      'Mọi Expert Advisor của TYO đều được công bố trên MQL5, sàn ứng dụng chính thức của MetaTrader. Tải về, cập nhật phiên bản, đánh giá và bình luận sản phẩm đều nằm ở đó.',
    formTitle: 'Gửi tin nhắn',
    formName: 'Họ tên',
    formEmail: 'Email',
    formSubject: 'Chủ đề',
    formMessage: 'Nội dung',
    formSend: 'Gửi tin nhắn',
    formSubjects: ['Câu hỏi chung', 'Về một Expert Advisor', 'Backtest / nghiên cứu', 'Hợp tác', 'Khác'],
    formNote:
      'Chúng tôi trả lời bằng tiếng Anh và tiếng Nhật. Vui lòng không gửi thông tin đăng nhập, mật khẩu broker hoặc chi tiết tài khoản giao dịch.',
    emailTitle: 'Email',
    noSupportTitle: 'Những việc chúng tôi không làm',
    noSupportBody:
      'Chúng tôi không cung cấp tư vấn đầu tư, quản lý tài khoản, dịch vụ tín hiệu hay bảo đảm lợi nhuận, và không thể tư vấn liệu một hệ thống có phù hợp với tình hình tài chính cá nhân của bạn hay không.',
  },

  footer: {
    tagline: 'Algorithmic Trading Lab',
    navTitle: 'Điều hướng',
    langTitle: 'Ngôn ngữ',
    linksTitle: 'Liên kết',
    madeIn: 'Được xây dựng tại Tokyo, Nhật Bản.',
    rights: 'Bảo lưu mọi quyền.',
    disclaimerTitle: 'Cảnh báo rủi ro',
    disclaimer: [
      'Giao dịch ngoại hối, CFD và tiền mã hóa có mức rủi ro cao và có thể không phù hợp với mọi nhà đầu tư. Bạn có thể mất nhiều hơn số vốn ban đầu. Đòn bẩy khuếch đại cả lợi nhuận lẫn thua lỗ.',
      'TYO phát triển và công bố phần mềm giao dịch tự động. Chúng tôi không cung cấp tư vấn đầu tư, quản lý danh mục hay tín hiệu giao dịch, và không nội dung nào trên trang này là khuyến nghị mua hoặc bán bất kỳ công cụ tài chính nào.',
      'Không Expert Advisor, thuật toán hay quá trình tối ưu hóa nào bảo đảm lợi nhuận. Mọi số liệu hiệu suất hiển thị trên trang này đều là dữ liệu quá khứ và không bảo đảm, không hàm ý, cũng không dự báo kết quả tương lai.',
      'Kết quả backtest là mô phỏng. Kết quả giao dịch thật sẽ khác do spread, trượt giá, phí hoa hồng, thanh khoản, tốc độ khớp lệnh, báo giá lại, điều kiện broker và thay đổi trạng thái thị trường.',
      'Bạn hoàn toàn chịu trách nhiệm đánh giá xem một hệ thống có phù hợp với hoàn cảnh của mình hay không, và chịu trách nhiệm cho mọi quyết định sử dụng nó. Hãy tìm tư vấn độc lập có giấy phép khi cần thiết.',
    ],
    backtestDisclaimerTitle: 'Về kết quả backtest',
    backtestDisclaimer:
      'Hiệu suất trong quá khứ không bảo đảm kết quả trong tương lai. Kết quả backtest có thể khác với giao dịch thật do spread, trượt giá, thanh khoản, điều kiện khớp lệnh và môi trường broker.',
  },

  seo: {
    home: {
      title: 'TYO — Algorithmic Trading, Engineered Differently',
      desc:
        'Phòng nghiên cứu giao dịch thuật toán độc lập. Nghiên cứu được AI tăng tốc, logic định lượng và thực thi tự động trên MetaTrader 5. Hơn 5.000 lượt tải EA miễn phí trên toàn cầu.',
    },
    ea: {
      title: 'Expert Advisor — TYO Algorithmic Trading Lab',
      desc:
        'Các Expert Advisor cho MetaTrader 5 do TYO phát triển. Mỗi hệ thống đều có tài liệu về ý tưởng, logic, mô hình rủi ro và điều kiện backtest.',
    },
    history: {
      title: 'Lịch sử phát triển — TYO Algorithmic Trading Lab',
      desc:
        'Cách một Expert Advisor của TYO thực sự được xây dựng: ý tưởng, nghiên cứu, nguyên mẫu, backtest, thất bại, làm lại, tối ưu hóa, forward test và phát hành.',
    },
    technology: {
      title: 'Công nghệ — TYO Algorithmic Trading Lab',
      desc:
        'Phát triển có AI hỗ trợ, phân tích định lượng, khoa học máy tính và kỹ thuật quản trị rủi ro đằng sau các Expert Advisor của TYO.',
    },
    lab: {
      title: 'Backtest Lab — TYO Algorithmic Trading Lab',
      desc: 'Báo cáo backtest, thí nghiệm tối ưu hóa, nghiên cứu tham số và nghiên cứu thị trường do TYO công bố.',
    },
    about: {
      title: 'Về TYO — Algorithmic Trading Lab',
      desc: 'TYO là một nhóm độc lập nhỏ tại Nhật Bản. Không phép màu, không tiên đoán, không bảo đảm.',
    },
    contact: {
      title: 'Liên hệ & MQL5 — TYO Algorithmic Trading Lab',
      desc: 'Liên hệ TYO, hoặc tìm các Expert Advisor của chúng tôi trên sàn MQL5.',
    },
  },
};
