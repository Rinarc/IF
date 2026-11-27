/* music-extra.js —— 第二街区 / 列车配乐槽位（music.js 本体一个字不改）
 * 用户提供的 5 个音源继续生效：曙光路白天/夜晚/雨天、汾阳中学、曙光路站。
 * 这里只追加新槽位并补几条场景→槽位规则，留空＝静默。
 * 注意：用户的 music.js 会自动为每家店铺生成 shop:店铺ID 槽位，
 * 所以迂龙路新开的店也各自有独立配乐位，无需在此重复添加。
 */
(function () {
  const PC = window.PC = window.PC || {};
  const M = PC.Music;
  if (!M || M._extraPatched) return;
  M._extraPatched = true;

  const EXTRA = [
    { key: 'yulong.day',   name: '迂龙路 · 白天',    group: '街区', src: '', hint: '17°C 晴 · 第二张设计稿' },
    { key: 'yulong.night', name: '迂龙路 · 夜晚',    group: '街区', src: '', hint: '19:00–06:00 自动切换' },
    { key: 'yulong.rain',  name: '迂龙路 · 雨天',    group: '街区', src: '', hint: '可选；留空沿用白天/夜晚' },
    { key: 'train',        name: '地铁车厢 · 行驶中', group: '场景', src: '', hint: '坐车那几秒' },
    { key: 'metro.hall',   name: '地铁站厅 · 闸机',  group: '场景', src: '', hint: '留空则沿用 metro 槽位' },
    { key: 'home',         name: '林景园 · 公寓家里', group: '场景', src: '', hint: '留空则沿用大街' },
    { key: 'estate',       name: '林景园 · 小区',     group: '场景', src: '', hint: '小区中轴 / 水池 / 健身区 · 留空则静默' },
    { key: 'villa',        name: '林景园 · 别墅',     group: '场景', src: '', hint: 'A / B / C 座通用 · 留空则静默' },
    { key: 'underground',  name: '地下小吃一条街',    group: '场景', src: '', hint: '下沉街 · 留空则静默' },
    { key: 'yuanyu',       name: '渊迂市渊迂中学',    group: '场景', src: '', hint: '第二张稿的校门 · 留空则静默' },
    { key: 'tram',         name: '有轨电车 · 站台',   group: '场景', src: '', hint: '留空则静默' }
  ];
  EXTRA.forEach(s => { if (!M.slots.find(q => q.key === s.key)) M.slots.push(s); });

  const origResolve = M.resolve;
  M.resolve = function (sceneId, night, weatherId) {
    if (sceneId === 'yulong') {
      if (weatherId === 'rain' && this.srcFor('yulong.rain')) return 'yulong.rain';
      return night ? 'yulong.night' : 'yulong.day';
    }
    if (sceneId === 'train') return 'train';
    if (sceneId === 'metro' && this.srcFor('metro.hall')) return 'metro.hall';
    if (sceneId === 'park') return this.srcFor('estate') ? 'estate' : 'park';
    if (sceneId.indexOf('villa:') === 0) return 'villa';
    if (sceneId === 'underground' || sceneId === 'yuanyu' || sceneId === 'tram' || sceneId === 'estate') return sceneId;
    if (sceneId === 'home' && this.srcFor('home')) return 'home';
    /* 游戏里店内的场景 id 是 interior:店铺ID，而配乐面板的槽位是 shop:店铺ID。
       这里做一次映射，让「每家店单独放歌」真正生效；没填的仍回落到 shop.default。 */
    if (sceneId.indexOf('interior:') === 0) {
      const shopKey = 'shop:' + sceneId.slice('interior:'.length);
      if (this.srcFor(shopKey)) return shopKey;
      return 'shop.default';
    }
    return origResolve.call(this, sceneId, night, weatherId);
  };

  M.extraSlots = EXTRA;
})();
