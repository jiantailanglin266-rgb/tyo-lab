/**
 * Bahasa Indonesia (id)
 * Menimpa en.mjs — kunci yang tidak didefinisikan otomatis kembali ke bahasa Inggris.
 * Kunci yang sengaja dibiarkan dalam bahasa Inggris: home.hero.line1/line2,
 * home.backtest.lines, home.tech.words, home.final.*, about.philosophyNo/philosophyYes
 * (merupakan tipografi merek).
 */
export default {
  meta: {
    brandLine: 'Algorithmic Trading Lab',
    defaultDesc:
      'TYO adalah lab trading algoritmik independen. Kami meneliti, merekayasa, dan menguji Expert Advisor MetaTrader 5 dengan pengembangan berbantuan AI, analisis kuantitatif, dan backtest yang ketat.',
  },

  nav: {
    home: 'Beranda',
    ea: 'Expert Advisor',
    history: 'Riwayat Pengembangan',
    technology: 'Teknologi',
    lab: 'Backtest Lab',
    about: 'Tentang TYO',
    contact: 'Kontak',
  },

  ui: {
    menu: 'Menu',
    close: 'Tutup',
    language: 'Bahasa',
    selectLanguage: 'Pilih bahasa',
    skipToContent: 'Lompat ke konten',
    scroll: 'Gulir',
    backToTop: 'Kembali ke atas',
    exploreEAs: 'Lihat EA Kami',
    ourStory: 'Kisah Pengembangan Kami',
    viewOnMql5: 'Lihat di MQL5',
    mql5Profile: 'Profil MQL5',
    downloadEA: 'Unduh EA',
    readMore: 'Baca selengkapnya',
    viewAll: 'Lihat semua',
    viewDetail: 'Lihat detail',
    free: 'Gratis',
    paid: 'Berbayar',
    comingSoon: 'Segera hadir',
    inDevelopment: 'Dalam pengembangan',
    released: 'Sudah dirilis',
    dataPending: 'Data menunggu publikasi',
    dataPendingNote:
      'Kami hanya memublikasikan angka yang sudah diverifikasi. Bagian ini muncul setelah laporan pengujian terkait difinalisasi.',
    notPublished: 'Belum dipublikasikan',
    updated: 'Diperbarui',
    published: 'Dipublikasikan',
    version: 'Versi',
    back: 'Kembali',
    externalLink: 'Terbuka di tab baru',
    playVideo: 'Putar video',
    pauseVideo: 'Jeda video',
    reduceMotionNote: 'Animasi dikurangi sesuai preferensi sistem Anda.',
  },

  home: {
    hero: {
      sub: 'Riset bertenaga AI. Logika kuantitatif. Eksekusi otomatis.',
      eyebrow: 'Lab Trading Algoritmik Independen',
    },
    intro: {
      eyebrow: 'Filosofi',
      h1: 'Kami Membangun Algoritma,',
      h2: 'Bukan Ramalan.',
      body1:
        'Kami tidak mengaku tahu ke mana pasar akan bergerak. Tidak ada yang tahu. Yang bisa direkayasa adalah proses di sekitar ketidakpastian itu.',
      body2:
        'Data. Probabilitas. Aturan. Kontrol risiko. Eksekusi otomatis. TYO menghadapi pasar dengan algoritma, bukan emosi — dan memperlakukan setiap hasil sebagai bukti pengamatan, bukan pembuktian mutlak.',
      pillars: [
        { k: 'Data', v: 'Diamati, bukan diasumsikan' },
        { k: 'Probabilitas', v: 'Distribusi, bukan kepastian' },
        { k: 'Aturan', v: 'Ditulis sebelum posisi dibuka' },
        { k: 'Risiko', v: 'Ditetapkan sebelum entri' },
        { k: 'Eksekusi', v: 'Otomatis dan dapat diulang' },
      ],
    },
    stats: {
      eyebrow: 'Komunitas',
      h: 'Digunakan trader di seluruh dunia.',
      body:
        'Expert Advisor gratis kami didistribusikan melalui MQL5, marketplace resmi MetaTrader. Setiap unduhan adalah seorang trader independen yang memilih menjalankan kode kami.',
      labels: {
        downloads: 'Unduhan EA Global',
        countries: 'Negara Terjangkau',
        releases: 'Rilis EA',
        backtests: 'Backtest Dijalankan',
        years: 'Tahun Riset',
      },
      source: 'Sumber: marketplace MQL5, total unduhan EA gratis.',
    },
    global: {
      eyebrow: 'Komunitas Global',
      h1: 'Dibangun di Jepang.',
      h2: 'Diuji oleh Trader di Seluruh Dunia.',
      body:
        'TYO dikembangkan di Tokyo, tetapi kodenya berjalan di terminal di India, Thailand, Indonesia, Vietnam, Tiongkok, dan negara lain. Broker berbeda. Spread berbeda. Jam pasar berbeda. Keragaman itulah uji tekan paling jujur yang bisa didapat sebuah algoritma.',
      legend: 'Wilayah komunitas aktif',
    },
    ai: {
      eyebrow: 'AI Accelerated Development',
      h1: 'AI bukan strateginya.',
      h2: 'AI adalah akselerasinya.',
      body:
        'Kami memakai AI di titik yang benar-benar melipatgandakan keluaran rekayasa: membaca data, menyusun draf kode, menstrukturkan pengujian, merangkum hasil, dan menjelajah ruang parameter. Logika tradingnya sendiri tetap eksplisit, terbaca, dan dapat diaudit.',
      note:
        'AI tidak memprediksi pasar, dan tidak ada keluaran model di situs ini yang disajikan sebagai ramalan harga di masa depan.',
      items: [
        { k: 'Bantuan Kode', v: 'Implementasi dan refaktor MQL5 lebih cepat' },
        { k: 'Riset', v: 'Telaah literatur, struktur pasar, dan perilaku harga' },
        { k: 'Analisis Data', v: 'Pemrosesan data tick dan bar dalam skala besar' },
        { k: 'Eksplorasi Parameter', v: 'Pencarian sistematis, bukan tebakan' },
        { k: 'Pengujian', v: 'Matriks pengujian otomatis lintas kondisi' },
        { k: 'Dokumentasi', v: 'Catatan pengujian yang konsisten dan dapat direproduksi' },
      ],
    },
    algorithm: {
      eyebrow: 'From Idea to Algorithm',
      body:
        'Sebuah pengamatan pasar belum menjadi strategi. Ia baru menjadi strategi setelah lolos definisi, kuantifikasi, implementasi, dan pengujian.',
      steps: [
        { n: '01', k: 'Data Pasar', v: 'Harga, volume, dan deret waktu mentah' },
        { n: '02', k: 'Kuantifikasi', v: 'Perilaku diterjemahkan jadi kondisi terukur' },
        { n: '03', k: 'Logika', v: 'Aturan entri, keluar, ukuran posisi, dan risiko' },
        { n: '04', k: 'Kode', v: 'Implementasi MQL5 yang deterministik' },
        { n: '05', k: 'Algoritma', v: 'Sistem trading utuh yang dapat diuji' },
        { n: '06', k: 'Expert Advisor', v: 'Eksekusi otomatis di MetaTrader 5' },
      ],
    },
    ea: {
      eyebrow: 'Expert Advisors',
      h: 'Sistem yang sudah kami rilis.',
      body:
        'Setiap Expert Advisor didokumentasikan lengkap dengan konsep, logika, model risiko, dan kondisi pengujiannya. Tanpa kotak hitam, tanpa hasil yang tak bisa dijelaskan.',
      cta: 'Lihat semua Expert Advisor',
    },
    backtest: {
      eyebrow: 'Backtest Lab',
      body:
        'Sebagian besar ide gagal. Justru itu intinya. Backtest bukan materi penjualan — ia adalah alat ukur yang memberi tahu ide mana yang layak diberi lebih banyak waktu.',
      cta: 'Masuk ke Backtest Lab',
    },
    history: {
      eyebrow: 'Development History',
      h: 'Setiap EA berawal dari sebuah pertanyaan.',
      questions: [
        'Bisakah perilaku ini dikuantifikasi?',
        'Bisakah risiko ini dikendalikan?',
        'Bisakah logika ini bertahan di kondisi pasar yang berbeda?',
      ],
      body: 'Lalu kami uji. Kami uji lagi. Lalu kami bangun ulang.',
      cta: 'Baca linimasa pengembangan',
    },
    tech: {
      eyebrow: 'Technology',
      h1: 'Pasar Hidup dalam Probabilitas,',
      h2: 'Bukan Kepastian.',
      body:
        'Kami meminjam bahasa teori probabilitas — distribusi, ketidakpastian, superposisi hasil — sebagai filosofi desain, bukan sebagai mesin prediksi. Satu transaksi adalah posisi di dalam sebuah distribusi, bukan hasil yang sudah diketahui.',
      cta: 'Jelajahi teknologinya',
    },
  },

  ea: {
    score: {
      title: 'TYO SCORE',
      insufficient: 'Data tidak cukup',
      note: 'Ukuran seberapa kuat bukti di balik backtest ini — bukan prediksi hasil di masa depan. Lihat model skor untuk cara setiap komponen dihitung.',
      capped: 'Subtotal {raw}, dibatasi pada {cap} karena drawdown maksimum mencapai {dd}. Tingkat profitabilitas apa pun tidak mengimbangi drawdown sebesar itu.',
      bands: {
        high: 'Bukti kuat',
        mid: 'Bukti memadai',
        low: 'Terbatas',
        weak: 'Lemah',
        'insufficient-data': 'Tertunda',
      },
      parts: {
        profitability: 'Profitabilitas',
        drawdownControl: 'Kendali drawdown',
        consistency: 'Konsistensi',
        sampleSize: 'Ukuran sampel',
        robustness: 'Ketahanan',
      },
    },
    charts: {
      year: 'Tahun',
      return: 'Imbal hasil',
      yearTotal: 'Setahun',
      equityCaption: 'Saldo akun sepanjang backtest. Garis putus-putus adalah puncak berjalan.',
      equityAria: 'Kurva saldo akun, {period}',
      heatAria: 'Imbal hasil bulanan per tahun, persen dari saldo awal bulan',
      heatLegend: 'Setiap sel adalah imbal hasil bulan itu sebagai persentase saldo awalnya. Hijau untung, merah rugi. Sel kosong berarti tidak ada transaksi tertutup.',
    },
    drawdown: {
      reported: 'Drawdown maksimum menurut laporan',
      closedBasis: 'Drawdown transaksi tertutup',
      worstWindow: 'Periode terburuk',
      recovered: 'Pulih',
      days: '{n} hari',
      maxLossStreak: 'Rentetan rugi terpanjang',
      balanceCaveat: 'Laporan ini menghitung drawdown atas dasar saldo, yang hanya menghitung transaksi tertutup. Posisi yang ditahan dalam kerugian belum muncul sampai ditutup, sehingga penurunan sebenarnya dari puncak lebih besar dari angka di atas.',
    },
    tradeStats: {
      direction: 'Arah',
      outcome: 'Hasil',
      size: 'Ukuran',
      longTrades: 'Posisi beli',
      shortTrades: 'Posisi jual',
      closedTrades: 'Transaksi tertutup',
      winRate: 'Win rate',
      lossRate: 'Loss rate',
      maxWinStreak: 'Rentetan menang terpanjang',
      maxLossStreak: 'Rentetan rugi terpanjang',
      avgWin: 'Rata-rata untung',
      avgLoss: 'Rata-rata rugi',
      largestWin: 'Untung terbesar',
      largestLoss: 'Rugi terbesar',
      payoffRatio: 'Rasio payoff',
      unitNote: 'Nominal ditampilkan dalam mata uang akun pengujian, yang tidak dinyatakan laporan ini. Rasio dan jumlah tidak terpengaruh.',
    },
    risk2: {
      warnTitle: 'Drawdown tinggi',
      warnBody: 'Sistem ini turun {dd} dari puncaknya selama pengujian. Penurunan sebesar itu hanya dapat dilalui dengan modal dan horizon yang sepadan. Baca pengungkapan risiko sebelum mempertimbangkannya.',
      observedTitle: 'Teramati dalam backtest',
      observedLead: 'Diukur dari catatan transaksi, bukan pernyataan pengembang.',
      obsMaxConcurrent: 'Posisi bersamaan maksimum',
      obsStacked: 'Entri dibuka saat posisi lain masih hidup',
      obsStopLossShare: 'Ditutup oleh stop loss',
      obsWorstStreak: 'Rentetan rugi terpanjang',
      declaredTitle: 'Dinyatakan pengembang',
      declaredPending: 'Belum dipublikasikan. Perilaku martingale, grid, averaging dan penskalaan posisi akan dinyatakan di sini setelah didokumentasikan.',
      martingale: 'Martingale',
      grid: 'Grid',
      averaging: 'Averaging',
      positionScaling: 'Penskalaan posisi',
      stopLoss: 'Stop loss',
      maxPositions: 'Posisi maksimum',
    },
    transparency: {
      note: 'Setiap angka di halaman ini berasal dari laporan MetaTrader Strategy Tester sistem ini. Tidak ada pemodelan, penghalusan atau estimasi. Kolom yang tidak dinyatakan laporan dibiarkan kosong.',
    },
    researchStatus: {
      live: 'Live',
      research: 'Riset',
      experimental: 'Eksperimental',
      development: 'Dalam pengembangan',
      archived: 'Diarsipkan',
    },
    sections: {
      overview: 'Ringkasan',
      architecture: 'Arsitektur strategi',
      performance: 'Ringkasan kinerja',
      equity: 'Kurva ekuitas',
      drawdown: 'Analisis drawdown',
      monthly: 'Imbal hasil bulanan',
      yearly: 'Kinerja tahunan',
      tradeStats: 'Statistik transaksi',
      riskProfile: 'Profil risiko',
      parameters: 'Parameter',
      story: 'Kisah pengembangan',
      versions: 'Riwayat versi',
      transparency: 'Transparansi riset',
      disclaimer: 'Penafian',
    },
    pending: {
      story: 'Kisah pengembangan sistem ini belum dipublikasikan.',
      architecture: 'Arsitektur strategi sistem ini belum dipublikasikan.',
    },
    index: {
      eyebrow: 'Expert Advisors',
      lead:
        'Sistem trading otomatis untuk MetaTrader 5 yang didistribusikan melalui MQL5. Setiap sistem di bawah ini didokumentasikan dengan logika yang dipakai, risiko yang diambil, dan kondisi pengujiannya.',
      empty: 'Belum ada Expert Advisor yang dipublikasikan. Rilis baru akan muncul di sini lebih dulu.',
      filterAll: 'Semua',
      count: 'sistem',
    },
    labels: {
      market: 'Pasar',
      symbol: 'Simbol',
      timeframe: 'Timeframe',
      strategy: 'Jenis Strategi',
      risk: 'Tingkat Risiko',
      version: 'Versi',
      releaseDate: 'Tanggal Rilis',
      price: 'Ketersediaan',
      platform: 'Platform',
      minDeposit: 'Saran Deposit Minimum',
      accountType: 'Jenis Akun',
      leverage: 'Leverage',
      vps: 'VPS',
      status: 'Status',
    },
    riskDerivedNote: 'Disimpulkan dari drawdown maksimum pada laporan tester, bukan dinyatakan pengembang.',
    risk: { low: 'Rendah', medium: 'Sedang', high: 'Tinggi', variable: 'Dapat dikonfigurasi' },
    detail: {
      overview: 'Ringkasan',
      concept: 'Konsep',
      strategy: 'Strategi',
      logic: 'Logika',
      riskManagement: 'Manajemen Risiko',
      backtest: 'Backtest',
      video: 'Video Backtest',
      parameters: 'Parameter',
      environment: 'Lingkungan yang Disarankan',
      history: 'Riwayat Pengembangan',
      versions: 'Riwayat Versi',
      download: 'Unduh',
      disclaimer: 'Penafian',
      paramName: 'Parameter',
      paramDefault: 'Bawaan',
      paramDesc: 'Deskripsi',
      versionCol: 'Versi',
      dateCol: 'Tanggal',
      changeCol: 'Perubahan',
      downloadBody:
        'Expert Advisor ini didistribusikan melalui MQL5, marketplace resmi MetaTrader. Unduhan, pembaruan, dan ulasan sepenuhnya ditangani di platform tersebut.',
      backToList: 'Semua Expert Advisor',
      nextEa: 'Sistem berikutnya',
    },
    metrics: {
      title: 'Ringkasan Backtest',
      period: 'Periode Backtest',
      initialDeposit: 'Deposit Awal',
      netProfit: 'Laba Bersih',
      maxDrawdown: 'Drawdown Maksimum',
      profitFactor: 'Profit Factor',
      totalTrades: 'Total Transaksi',
      winRate: 'Win Rate',
      recoveryFactor: 'Recovery Factor',
      expectedPayoff: 'Expected Payoff',
      sharpe: 'Rasio Sharpe',
      broker: 'Broker / Server',
      spread: 'Spread',
      commission: 'Komisi',
      modeling: 'Metode Pemodelan',
      dataSource: 'Sumber Data',
      quality: 'Kualitas Pemodelan',
      conditions: 'Kondisi Pengujian',
      curveAlt: 'Kurva saldo dan ekuitas dari laporan tester',
      curveCaption: 'Kurva saldo / ekuitas yang diekspor langsung dari laporan Strategy Tester.',
      ddBasis: 'Dasar Drawdown',
      ddBasis_equity: 'Ekuitas (termasuk posisi terbuka)',
      ddBasis_balance: 'Saldo (hanya transaksi tertutup)',
    },
  },

  history: {
    eyebrow: 'Development History',
    lead:
      'Ini bukan riwayat perusahaan. Ini adalah bagaimana sebuah sistem trading benar-benar dibangun — termasuk bagian yang tidak berhasil.',
    processTitle: 'Loop yang kami jalankan pada setiap sistem',
    failureTitle: 'Kegagalan adalah bagian dari catatan',
    failureBody:
      'Merek riset yang hanya menampilkan kemenangan sebenarnya merek pemasaran. Model yang dibuang, logika yang ditulis ulang, dan asumsi yang ditinggalkan kami cantumkan karena semua itulah alasan sistem yang bertahan bisa ada.',
    milestonesTitle: 'Tonggak terpilih',
    stage: 'Tahap',
  },

  technology: {
    eyebrow: 'Technology',
    lead:
      'Teknologi dan cara berpikir di balik setiap sistem TYO. Tidak ada sihir eksklusif di sini — hanya disiplin rekayasa standar yang diterapkan secara konsisten pada perangkat lunak trading.',
    aiTitle: 'Kecerdasan Buatan',
    aiLead:
      'Di TYO, AI adalah akselerator pengembangan, bukan peramal. Ia memperpendek jarak antara sebuah ide dan implementasi yang bisa diuji.',
    aiWarning:
      'Kami tidak memakai AI untuk memprediksi harga, dan tidak menyajikan keluaran model mana pun sebagai ramalan arah pasar.',
    quantumTitle: 'Probabilitas, Bukan Kepastian',
    quantumLead:
      'Bahasa visual dan konseptual kami berasal dari teori probabilitas — distribusi, ketidakpastian, superposisi hasil, sistem partikel. Ia membentuk cara kami mendesain dan menyajikan hasil. Ini adalah filosofi kerendahan hati terhadap masa depan, bukan klaim prediksi fisika.',
    quantumPoints: [
      { k: 'Probabilitas', v: 'Setiap transaksi adalah satu tarikan dari sebuah distribusi.' },
      { k: 'Ketidakpastian', v: 'Interval keyakinan, bukan target harga.' },
      { k: 'Distribusi', v: 'Nilai bentuk sebaran hasil, bukan satu hasil.' },
      { k: 'Varians', v: 'Drawdown adalah bagian desain sistem, bukan kecelakaan.' },
    ],
    csTitle: 'Sistem Trading Adalah Perangkat Lunak.',
    csTitle2: 'Perangkat Lunak Harus Direkayasa.',
    csLead:
      'Sebuah Expert Advisor adalah program real-time yang mengelola uang di bawah latensi, informasi parsial, dan kasus tepi yang keras. Kami memperlakukannya seperti perangkat lunak produksi.',
    csItems: [
      { k: 'Algoritma', v: 'Prosedur keputusan yang eksplisit dan terbaca' },
      { k: 'Logika', v: 'Kondisi deterministik tanpa status tersembunyi' },
      { k: 'State', v: 'Posisi, order, dan pemulihan setelah koneksi terputus' },
      { k: 'Eksekusi', v: 'Slippage, requote, dan fill parsial ditangani' },
      { k: 'Latensi', v: 'Penanganan tick yang tidak memblokir terminal' },
      { k: 'Data', v: 'Riwayat level tick dengan kualitas yang didokumentasikan' },
      { k: 'Otomasi', v: 'Alur uji dan rilis yang dapat direproduksi' },
    ],
    stackTitle: 'Teknologi & Disiplin',
    stack: [
      { k: 'MetaTrader 5', v: 'Platform target untuk eksekusi dan pengujian' },
      { k: 'MQL5', v: 'Bahasa implementasi untuk semua sistem yang dirilis' },
      { k: 'Strategy Tester', v: 'Backtest level tick dan optimasi' },
      { k: 'Analisis Kuantitatif', v: 'Evaluasi statistik atas hasil' },
      { k: 'Riset Machine Learning', v: 'Masih tahap eksplorasi riset saja' },
      { k: 'Manajemen Risiko', v: 'Ukuran posisi, eksposur, dan desain stop' },
      { k: 'Otomasi', v: 'Matriks uji terskrip dan pembuatan laporan' },
      { k: 'Version Control', v: 'Setiap rilis dapat dilacak ke sumbernya' },
    ],
  },

  lab: {
    eyebrow: 'Backtest Lab',
    lead:
      'Catatan riset, laporan pengujian, dan eksperimen. Dipublikasikan apa adanya — termasuk yang berakhir dengan hipotesis yang ditolak.',
    empty: 'Catatan riset pertama sedang disiapkan untuk publikasi.',
    labels: {
      date: 'Tanggal',
      ea: 'Sistem',
      market: 'Pasar',
      period: 'Periode Pengujian',
      hypothesis: 'Hipotesis',
      method: 'Metode',
      result: 'Hasil',
      conclusion: 'Kesimpulan',
      type: 'Jenis',
      readingTime: 'menit baca',
    },
    types: {
      backtestReport: 'Laporan Backtest',
      optimization: 'Eksperimen Optimasi',
      parameterStudy: 'Studi Parameter',
      marketResearch: 'Riset Pasar',
      comparison: 'Perbandingan EA',
      versionTest: 'Uji Versi',
    },
    backToList: 'Semua catatan riset',
  },

  about: {
    eyebrow: 'About TYO',
    lead:
      'TYO adalah tim independen kecil di Jepang yang membangun sistem trading otomatis. Kami engineer dan peneliti lebih dulu, dan kami memublikasikan pekerjaan kami agar dinilai dari dokumentasinya, bukan dari janjinya.',
    whoTitle: 'Siapa kami',
    whoBody:
      'Tim independen yang ramping — bukan dana kelolaan, bukan broker, bukan layanan sinyal. Kami memadukan rekayasa perangkat lunak, pengembangan berbantuan AI, riset kuantitatif, dan trading algoritmik untuk merancang, menguji, dan merilis Expert Advisor untuk MetaTrader 5.',
    whoNote:
      'Kami sengaja tidak menampilkan diri lebih besar dari kenyataan. Nilainya ada pada metode dan dokumentasi, bukan pada ukuran organisasi.',
    philosophyTitle: 'Filosofi Kami',
    philosophyBody:
      'Siapa pun bisa memublikasikan kurva ekuitas. Jauh lebih sedikit yang mau memublikasikan kondisi saat kurva itu dihasilkan, versi-versi yang gagal sebelumnya, dan risiko yang dibawanya. Perbedaan itulah keseluruhan merek ini.',
    principlesTitle: 'Cara kami bekerja',
    principles: [
      { k: 'Dokumentasikan kondisinya', v: 'Hasil tanpa kondisi pengujiannya bukanlah hasil.' },
      { k: 'Publikasikan kegagalannya', v: 'Model yang dibuang menjelaskan model yang bertahan.' },
      { k: 'Jangan pernah menjamin hasil', v: 'Tidak ada sistem yang bisa; merek yang mengklaim sebaliknya sedang menjual hal lain.' },
      { k: 'Jaga logika tetap terbaca', v: 'Jika kami tak bisa menjelaskan alasan sebuah posisi dibuka, kami tidak merilisnya.' },
      { k: 'Hormati risiko lebih dulu', v: 'Drawdown dirancang sebelum laba diukur.' },
    ],
    contactCta: 'Hubungi kami',
  },

  contact: {
    eyebrow: 'Contact',
    lead:
      'Pertanyaan tentang sebuah sistem, laporan pengujian, atau kolaborasi. Unduhan, pembaruan, dan dukungan produk ditangani melalui MQL5.',
    mql5Title: 'MQL5',
    mql5Body:
      'Setiap Expert Advisor TYO dipublikasikan di MQL5, marketplace resmi MetaTrader. Unduhan, pembaruan versi, ulasan, dan komentar produk semuanya ada di sana.',
    formTitle: 'Kirim pesan',
    formName: 'Nama',
    formEmail: 'Email',
    formSubject: 'Subjek',
    formMessage: 'Pesan',
    formSend: 'Kirim pesan',
    formSubjects: ['Pertanyaan umum', 'Tentang sebuah Expert Advisor', 'Backtest / riset', 'Kolaborasi', 'Lainnya'],
    formNote:
      'Kami menjawab dalam bahasa Inggris dan Jepang. Mohon jangan mengirim kredensial akun, kata sandi broker, atau detail akun trading.',
    emailTitle: 'Email',
    noSupportTitle: 'Yang tidak bisa kami lakukan',
    noSupportBody:
      'Kami tidak memberikan nasihat investasi, pengelolaan dana, langganan sinyal, atau jaminan keuntungan, dan kami tidak dapat menilai apakah sebuah sistem cocok dengan kondisi keuangan pribadi Anda.',
  },

  footer: {
    tagline: 'Algorithmic Trading Lab',
    navTitle: 'Navigasi',
    langTitle: 'Bahasa',
    linksTitle: 'Tautan',
    madeIn: 'Dibangun di Tokyo, Jepang.',
    rights: 'Seluruh hak dilindungi.',
    disclaimerTitle: 'Penafian Risiko',
    disclaimer: [
      'Perdagangan valuta asing, CFD, dan kripto memiliki risiko tinggi dan mungkin tidak cocok untuk setiap investor. Anda dapat kehilangan lebih dari deposit awal. Leverage memperbesar keuntungan sekaligus kerugian.',
      'TYO mengembangkan dan memublikasikan perangkat lunak trading otomatis. Kami tidak memberikan nasihat investasi, pengelolaan portofolio, atau sinyal trading, dan tidak ada isi situs ini yang merupakan rekomendasi untuk membeli atau menjual instrumen apa pun.',
      'Tidak ada Expert Advisor, algoritma, atau optimasi yang menjamin keuntungan. Setiap angka kinerja di situs ini bersifat historis dan tidak menjamin, menyiratkan, atau memprediksi hasil di masa depan.',
      'Hasil backtest adalah simulasi. Hasil live berbeda karena spread, slippage, komisi, likuiditas, kecepatan eksekusi, requote, kondisi broker, dan perubahan rezim pasar.',
      'Anda sepenuhnya bertanggung jawab menilai apakah sebuah sistem sesuai dengan keadaan Anda, dan atas setiap keputusan yang Anda ambil dengannya. Mintalah nasihat profesional berlisensi bila diperlukan.',
    ],
    backtestDisclaimerTitle: 'Tentang hasil backtest',
    backtestDisclaimer:
      'Kinerja masa lalu tidak menjamin hasil di masa depan. Hasil backtest dapat berbeda dari trading live karena spread, slippage, likuiditas, kondisi eksekusi, dan lingkungan broker.',
  },

  seo: {
    home: {
      title: 'TYO — Algorithmic Trading, Engineered Differently',
      desc:
        'Lab trading algoritmik independen. Riset yang diakselerasi AI, logika kuantitatif, dan eksekusi otomatis untuk MetaTrader 5. Lebih dari 5.000 unduhan EA gratis di seluruh dunia.',
    },
    ea: {
      title: 'Expert Advisor — TYO Algorithmic Trading Lab',
      desc:
        'Expert Advisor MetaTrader 5 yang dikembangkan TYO. Setiap sistem terdokumentasi dengan konsep, logika, model risiko, dan kondisi backtest.',
    },
    history: {
      title: 'Riwayat Pengembangan — TYO Algorithmic Trading Lab',
      desc:
        'Bagaimana Expert Advisor TYO benar-benar dibangun: ide, riset, prototipe, backtest, kegagalan, pembangunan ulang, optimasi, forward test, rilis.',
    },
    technology: {
      title: 'Teknologi — TYO Algorithmic Trading Lab',
      desc:
        'Pengembangan berbantuan AI, analisis kuantitatif, ilmu komputer, dan rekayasa risiko di balik Expert Advisor TYO.',
    },
    lab: {
      title: 'Backtest Lab — TYO Algorithmic Trading Lab',
      desc: 'Laporan backtest, eksperimen optimasi, studi parameter, dan riset pasar yang dipublikasikan TYO.',
    },
    about: {
      title: 'Tentang — TYO Algorithmic Trading Lab',
      desc: 'TYO adalah tim independen kecil di Jepang. Tanpa sihir, tanpa ramalan, tanpa jaminan.',
    },
    contact: {
      title: 'Kontak & MQL5 — TYO Algorithmic Trading Lab',
      desc: 'Hubungi TYO, atau temukan Expert Advisor kami di marketplace MQL5.',
    },
  },
};
