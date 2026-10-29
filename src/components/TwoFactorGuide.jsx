const STEPS = [
  {
    n: '1',
    title: '它是什么，要不要开',
    lines: [
      '二次验证是登录时多问一句：手机验证器里正在显示的 6 位数字。',
      '这串数字每 30 秒变一次，只有你的手机 App 里有。',
      '可以不开。开启后，别人就算知道密码，没有这 6 位数字也进不了账号。'
    ]
  },
  {
    n: '2',
    title: '手机先装一个验证器（免费）',
    lines: [
      '苹果：打开 App Store，搜索 Google Authenticator 或 Microsoft Authenticator。',
      '安卓：打开应用商店，搜索同样的名字，安装官方应用。',
      '1Password、Authy 也可以。任选一个即可，不要装来路不明的 App。'
    ]
  },
  {
    n: '3',
    title: '回到本页，点「开始绑定」',
    lines: [
      '页面会出现一个二维码。打开验证器，点右上角或底部的「+ / 添加」。',
      '选「扫描二维码」，把摄像头对准这个码。',
      '扫成功后，验证器里会出现本站账号，下面有 6 位数字在跳动。'
    ]
  },
  {
    n: '4',
    title: '扫不了码时：手动输入',
    lines: [
      '在验证器里选「输入设置密钥」或「手动添加」。',
      '账号名随便填（例如你的用户名），密钥粘贴本页显示的那一串大写字母。',
      '类型选「基于时间」（Time based）。保存后同样会出现 6 位数字。'
    ]
  },
  {
    n: '5',
    title: '把 6 位数字填回来，才算开启',
    lines: [
      '输入验证器里当前这一组 6 位数字（不要等它跳到下一组再抄一半）。',
      '点「确认启用」。只有这一步成功，二次验证才真正打开。',
      '密钥只在绑定当次显示，确认 App 里已经有这个账号再往下。'
    ]
  },
  {
    n: '6',
    title: '以后怎么登录、换手机怎么办',
    lines: [
      '开启后，用密码或 Telegram 登录都会多填一次验证码。',
      '换手机：先在旧手机验证器里导出/迁移账号，或先在本页关闭再重新绑定。',
      '手机丢了又没迁移：将无法登录。请先走忘记密码也解决不了验证码，需要联系客服处理。'
    ]
  }
];

export default function TwoFactorGuide({ defaultOpen = true }) {
  return (
    <details defaultOpen={defaultOpen} className="rounded-xl border border-cyan-100 bg-cyan-50/60">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-bold text-slate-800">
        不会用？先看 2 分钟教程（建议收藏）
      </summary>
      <div className="px-4 pb-4 space-y-3">
        {STEPS.map((step) => (
          <div key={step.n} className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-sm font-bold text-slate-800 mb-1.5">
              <span className="inline-flex w-5 h-5 mr-2 rounded-full bg-cyan-500 text-white text-xs items-center justify-center align-middle">
                {step.n}
              </span>
              {step.title}
            </p>
            <ul className="space-y-1 pl-7">
              {step.lines.map((line) => (
                <li key={line} className="text-xs text-slate-600 leading-relaxed list-disc">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
