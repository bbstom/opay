import { useNavigate } from 'react-router-dom';
import { Users, Target, Award, TrendingUp } from 'lucide-react';
import SEOHead from '../../components/SEOHead';

const CompanyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SEOHead
        title="关于我们 - 专业的加密货币支付服务提供商 | 公司介绍"
        description="专业的加密货币支付服务提供商，致力于为全球用户提供安全、快速、便捷的支付解决方案。已为 12,000+ 用户提供服务。"
        keywords={[
          '加密货币支付平台',
          'USDT 代付服务商',
          '区块链支付',
          '数字货币支付',
          '加密货币服务',
          '波场支付平台'
        ]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "可可代付",
          "description": "专业的加密货币支付服务提供商",
          "url": typeof window !== 'undefined' ? window.location.origin : ''
        }}
      />
      {/* 面包屑 */}
      <div className="bg-white border-b border-slate-200 pt-14">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <button onClick={() => navigate('/')} className="hover:text-cyan-600">首页</button>
            <span>/</span>
            <button onClick={() => navigate('/services')} className="hover:text-cyan-600">服务总览</button>
            <span>/</span>
            <span className="text-slate-900 font-medium">公司介绍</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative pt-6 pb-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[180px] bg-gradient-to-b from-cyan-50/50 to-transparent -z-10"></div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-black text-slate-900 leading-tight mb-2">
              关于我们
            </h1>
            <p className="text-sm text-slate-600">
              专业的加密货币支付服务提供商，致力于为全球用户提供安全、快速、便捷的支付解决方案
            </p>
          </div>
        </div>
      </section>

      {/* 公司简介 */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-8">公司简介</h2>
          <div className="prose prose-sm text-slate-600 leading-relaxed space-y-4">
            <p>
              我们是一家专注于加密货币支付领域的创新型科技公司，成立于 2022 年。
              公司总部位于新加坡，团队成员来自区块链、金融科技、互联网等多个领域，拥有丰富的行业经验。
            </p>
            <p>
              我们的使命是让加密货币支付像传统支付一样简单、安全、高效。
              通过自主研发的技术平台，我们为个人用户和企业客户提供 USDT/TRX 代付、能量租赁、闪兑等一站式服务。
            </p>
            <p>
              自成立以来，我们已为超过 12,000 名用户提供服务，累计处理交易超过 500,000 笔，交易金额超过 5000 万美元。
              我们的服务覆盖跨境电商、自由职业者、游戏工作室、内容创作平台等多个行业。
            </p>
          </div>
        </div>
      </section>

      {/* 发展历程 */}
      <section className="py-8 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">发展历程</h2>
          <div className="space-y-8">
            {[
              { year: '2022.03', title: '项目启动', desc: '团队组建，开始市场调研和技术预研' },
              { year: '2022.08', title: '技术突破', desc: '完成核心技术架构设计，启动产品开发' },
              { year: '2023.01', title: '内测上线', desc: '推出测试版本，邀请首批用户体验' },
              { year: '2023.05', title: '正式运营', desc: '平台正式上线，推出 USDT/TRX 代付服务' },
              { year: '2023.09', title: '用户增长', desc: '注册用户突破 3,000 人，日均交易量稳步提升' },
              { year: '2024.02', title: '功能扩展', desc: '推出能量租赁服务，大幅降低用户转账成本' },
              { year: '2024.06', title: '服务升级', desc: '上线闪兑功能，实现 TRX/USDT 快速兑换' },
              { year: '2024.10', title: '重要里程碑', desc: '用户突破 12,000 人，累计交易额超过 5000 万美元' }
            ].map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex-shrink-0 w-24 text-right">
                  <div className="text-lg font-bold text-cyan-600">{item.year}</div>
                </div>
                <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4">
                  <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 服务理念 */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">服务理念</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: <Users />, title: '用户至上', desc: '始终将用户需求放在第一位，提供优质的服务体验' },
              { icon: <Target />, title: '专业专注', desc: '专注于加密货币支付领域，不断提升专业能力' },
              { icon: <Award />, title: '安全可靠', desc: '采用银行级安全措施，确保用户资金和数据安全' },
              { icon: <TrendingUp />, title: '持续创新', desc: '不断探索新技术，为用户提供更好的产品和服务' }
            ].map((item, i) => (
              <div key={i} className="bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200 p-4">
                <div className="bg-cyan-50 w-8 h-8 rounded-lg flex items-center justify-center text-cyan-600 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 数据统计 */}
      <section className="py-8 bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl font-bold mb-6 text-center">数据统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-black mb-1">12,000+</div>
              <div className="text-cyan-100">服务用户</div>
            </div>
            <div>
              <div className="text-2xl font-black mb-1">500,000+</div>
              <div className="text-cyan-100">交易笔数</div>
            </div>
            <div>
              <div className="text-2xl font-black mb-1">$50M+</div>
              <div className="text-cyan-100">交易金额</div>
            </div>
            <div>
              <div className="text-2xl font-black mb-1">99.9%</div>
              <div className="text-cyan-100">服务可用性</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-8 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-6">加入我们</h2>
          <p className="text-sm text-slate-600 mb-4">
            成为我们的用户，体验专业的加密货币支付服务
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-cyan-600 transition-all shadow-sm"
          >
            立即注册
          </button>
        </div>
      </section>
    </div>
  );
};

export default CompanyPage;
