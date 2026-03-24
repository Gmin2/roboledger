import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import {
  Background,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './archi.css'

/** Chapter definition — each chapter drives a sidebar entry, scroll section, and sticky figure. */
interface Chapter {
  id: string
  index: string
  group: string
  title: string
  subtitle: string
  Figure: ComponentType
  docs: ReactNode
}

/** All ten chapters, grouped by narrative arc. */
const chapters: Chapter[] = [
  {
    id: 'hero',
    index: '01',
    group: 'Overview',
    title: 'RoboLedger',
    subtitle: 'ERC-8004 for Physical Robots',
    Figure: HeroFigure,
    docs: (
      <>
        <p>
          RoboLedger is the first implementation of ERC-8004 (Agent Protocol) on
          Hedera&mdash;giving physical robots on-chain identity, task
          marketplace, proof-of-completion, and reputation&mdash;all powered by
          HCS, HTS, and smart contracts.
        </p>
        <div className="doc-grid">
          <div className="doc-card">
            <h5>$0.0001 / msg</h5>
            <p>
              HCS message cost&mdash;orders of magnitude cheaper than peaq
              storage deposits or Ethereum calldata.
            </p>
          </div>
          <div className="doc-card">
            <h5>3s finality</h5>
            <p>
              aBFT consensus with fair ordering. No MEV, no gas auctions, no
              block confirmations to wait for.
            </p>
          </div>
          <div className="doc-card">
            <h5>35 tests</h5>
            <p>
              Full test suite covering identity, marketplace, escrow, reputation,
              validation, and ROS2 bridge integration.
            </p>
          </div>
          <div className="doc-card">
            <h5>3 registries</h5>
            <p>
              Identity (HTS NFTs), Reputation (on-chain scoring), and Validation
              (multi-party consensus)&mdash;the three pillars of ERC-8004.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'problem',
    index: '02',
    group: 'Overview',
    title: 'The Trust Gap',
    subtitle: 'Why Robots Need On-Chain Identity',
    Figure: ProblemFigure,
    docs: (
      <>
        <p>
          As autonomous robots move from labs to streets, a fundamental trust
          problem emerges: <strong>how do you verify a robot is who it claims
          to be, that it did the work it claims to have done, and that it
          deserves to be paid?</strong>
        </p>
        <h4>Market context</h4>
        <ul>
          <li>
            <strong>OpenMind</strong> raised $20M (Pantera Capital) for
            decentralized AI agent coordination
          </li>
          <li>
            <strong>Konnex</strong> raised $15M for DePIN robotics
            infrastructure
          </li>
          <li>
            <strong>peaq</strong> has 60+ DePIN apps on its custom L1, proving
            demand for machine identity
          </li>
        </ul>
        <p>
          &ldquo;DeRobotics&rdquo; is the hottest DePIN narrative. But nobody
          has built this on <strong>Hedera</strong>&mdash;the network with the
          lowest fees, fairest ordering, and native token keys purpose-built
          for machine identity management.
        </p>
      </>
    ),
  },
  {
    id: 'hedera',
    index: '03',
    group: 'Why Hedera',
    title: 'Why Hedera',
    subtitle: 'Native Advantages Over Custom L1s',
    Figure: HederaFigure,
    docs: (
      <>
        <p>
          Most DePIN projects launch a custom L1 or bolt-on infrastructure.
          Hedera already has every primitive we need&mdash;natively.
        </p>
        <h4>Cost comparison</h4>
        <div className="doc-type-grid">
          {[
            ['HCS message', '$0.0001 — fixed, predictable'],
            ['peaq storage', 'Storage deposit + tx fee — variable'],
            ['Ethereum calldata', '$0.50–$5.00 — gas auction volatility'],
          ].map(([item, cost]) => (
            <div key={item}>
              <code>{item}</code>
              <span>{cost}</span>
            </div>
          ))}
        </div>
        <h4>Native advantages</h4>
        <ul>
          <li>
            <strong>aBFT finality in 3 seconds</strong> &mdash; no block
            confirmations, no reorgs
          </li>
          <li>
            <strong>Native KYC/freeze token keys</strong> &mdash; built into
            HTS, not a custom pallet
          </li>
          <li>
            <strong>Fair ordering</strong> &mdash; consensus timestamps prevent
            MEV extraction
          </li>
          <li>
            <strong>Mirror Node</strong> &mdash; free read access to all
            historical data
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'system',
    index: '04',
    group: 'Architecture',
    title: 'System Architecture',
    subtitle: 'Five Components, One Protocol',
    Figure: SystemFigure,
    docs: (
      <>
        <p>
          RoboLedger is five components working as one protocol. Each component
          has a single responsibility and communicates through well-defined
          Hedera primitives.
        </p>
        <div className="doc-stages">
          <div className="doc-stage">
            <span className="doc-stage-num">1</span>
            <div>
              <h5>HCS Topics</h5>
              <p>
                Three topics (tasks, bids, proofs) carry all machine-to-machine
                messages at $0.0001 each with consensus timestamps.
              </p>
            </div>
          </div>
          <div className="doc-stage">
            <span className="doc-stage-num">2</span>
            <div>
              <h5>Smart Contracts</h5>
              <p>
                Escrow, Reputation, and Validation contracts enforce economic
                rules on-chain. Solidity, deployed to Hedera EVM.
              </p>
            </div>
          </div>
          <div className="doc-stage">
            <span className="doc-stage-num">3</span>
            <div>
              <h5>SDK + CLI</h5>
              <p>
                TypeScript SDK wraps all Hedera interactions. CLI provides
                human-friendly commands for the full lifecycle.
              </p>
            </div>
          </div>
          <div className="doc-stage">
            <span className="doc-stage-num">4</span>
            <div>
              <h5>ROS2 Bridge</h5>
              <p>
                Native ROS2 node subscribes to sensor topics, hashes data, and
                publishes proofs to HCS in one hop.
              </p>
            </div>
          </div>
          <div className="doc-stage">
            <span className="doc-stage-num">5</span>
            <div>
              <h5>Dashboard</h5>
              <p>
                React frontend reads from Mirror Node to display fleet status,
                task history, and reputation scores.
              </p>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'identity',
    index: '05',
    group: 'Architecture',
    title: 'Identity Registry',
    subtitle: 'HTS NFTs with Native Role Keys',
    Figure: IdentityFigure,
    docs: (
      <>
        <p>
          Every robot gets an HTS NFT. But unlike a plain ERC-721, Hedera token
          keys give us <strong>native role-based access control</strong> without
          custom smart contract logic.
        </p>
        <h4>Key roles</h4>
        <div className="doc-type-grid">
          {[
            ['supplyKey', 'Manufacturer — can mint new robot NFTs'],
            ['kycKey', 'Certifier — approves robots to operate'],
            ['freezeKey', 'Safety Authority — can ground a robot instantly'],
            ['metadataKey', 'Robot itself — can update firmware hash'],
          ].map(([key, role]) => (
            <div key={key}>
              <code>{key}</code>
              <span>{role}</span>
            </div>
          ))}
        </div>
        <h4>Comparison to peaq</h4>
        <p>
          peaq requires a custom DID pallet + RBAC pallet + storage pallet to
          achieve what Hedera does natively with four token keys on a single
          HTS token. No custom chain logic, no governance votes, no pallet
          upgrades.
        </p>
      </>
    ),
  },
  {
    id: 'marketplace',
    index: '06',
    group: 'Architecture',
    title: 'Task Marketplace',
    subtitle: 'HCS Fair-Ordered Bidding + Escrow',
    Figure: MarketplaceFigure,
    docs: (
      <>
        <p>
          Tasks and bids flow through HCS topics. Hedera&apos;s consensus
          timestamps guarantee <strong>fair ordering</strong>&mdash;no
          frontrunning, no MEV, no gas auctions.
        </p>
        <h4>HCS ordering guarantees</h4>
        <ul>
          <li>
            Every message gets an immutable consensus timestamp from the
            hashgraph
          </li>
          <li>
            Bids are ordered by arrival, not by gas price or validator
            preference
          </li>
          <li>
            Mirror Node provides verifiable ordering proof for dispute
            resolution
          </li>
        </ul>
        <h4>Escrow contract</h4>
        <p>
          When a task is assigned, HBAR is locked in escrow. The contract
          releases payment only when the Validation Registry confirms
          proof-of-completion. If the robot fails, the client gets a refund and
          the robot&apos;s reputation is penalized.
        </p>
      </>
    ),
  },
  {
    id: 'proof',
    index: '07',
    group: 'Architecture',
    title: 'Proof & Validation',
    subtitle: 'Multi-Party Consensus for Physical Work',
    Figure: ProofFigure,
    docs: (
      <>
        <p>
          How do you prove a robot actually delivered a package or cleaned a
          floor? RoboLedger uses <strong>multi-party validation</strong>&mdash;a
          threshold of independent validators must approve proof-of-completion
          before payment is released.
        </p>
        <h4>Proof-of-completion flow</h4>
        <ul>
          <li>Robot streams sensor data hashes to HCS Proofs Topic</li>
          <li>
            Each validator independently verifies the proof (GPS coordinates,
            camera feed hash, task-specific criteria)
          </li>
          <li>When threshold is met, the Validation Registry emits approval</li>
          <li>Escrow contract releases HBAR to the robot&apos;s account</li>
        </ul>
        <h4>ERC-8004 Validation Registry</h4>
        <p>
          Implements the <code>IValidationRegistry</code> interface from
          ERC-8004: <code>submitValidation()</code>,{' '}
          <code>getValidationStatus()</code>, and{' '}
          <code>isValidated()</code>&mdash;extended with Hedera-native HCS
          proof anchoring.
        </p>
      </>
    ),
  },
  {
    id: 'reputation',
    index: '08',
    group: 'Integration',
    title: 'Reputation Registry',
    subtitle: 'On-Chain Feedback Scoring',
    Figure: ReputationFigure,
    docs: (
      <>
        <p>
          Every completed task updates the robot&apos;s on-chain reputation
          score. Feedback is <strong>automatic on settlement</strong> (positive)
          and <strong>automatic on refund</strong> (negative), with optional
          manual override by the client.
        </p>
        <h4>Interface</h4>
        <div className="doc-type-grid">
          {[
            ['giveFeedback(robotId, score, tags, comment)', 'Submit feedback for a completed task'],
            ['getSummary(robotId)', 'Returns avg score, total tasks, tag breakdown'],
            ['getHistory(robotId, offset, limit)', 'Paginated feedback entries'],
          ].map(([fn, desc]) => (
            <div key={fn}>
              <code>{fn}</code>
              <span>{desc}</span>
            </div>
          ))}
        </div>
        <h4>Sybil resistance</h4>
        <p>
          Only accounts that have <em>actually completed</em> a task (verified
          by the escrow contract) can leave feedback. No fake reviews, no
          reputation farming&mdash;every score is backed by an on-chain
          settlement event.
        </p>
      </>
    ),
  },
  {
    id: 'ros2',
    index: '09',
    group: 'Integration',
    title: 'ROS2 Bridge',
    subtitle: 'Sensor Data to Hedera in One Hop',
    Figure: ROS2Figure,
    docs: (
      <>
        <p>
          The ROS2 Bridge is a native ROS2 node (Python, rclpy) that subscribes
          to robot sensor topics and publishes proof hashes directly to HCS.
          No middleware, no custom protocols&mdash;<strong>one hop from
          sensor to ledger</strong>.
        </p>
        <h4>Architecture</h4>
        <ul>
          <li>
            Subscribes to ROS2 topics: <code>/odom</code>, <code>/gps</code>,{' '}
            <code>/camera</code>
          </li>
          <li>SHA-256 hashes sensor data payload</li>
          <li>Calls CLI as subprocess to submit HCS message</li>
          <li>Also listens to HCS Tasks Topic and publishes available tasks
            to <code>/roboledger/available_tasks</code></li>
        </ul>
        <h4>peaq-ros2 comparison</h4>
        <p>
          peaq&apos;s ROS2 integration requires 5 steps: ROS2 &rarr; custom
          middleware &rarr; peaq SDK &rarr; DID resolution &rarr; storage
          pallet. RoboLedger does it in 1 step: ROS2 &rarr; CLI &rarr; HCS.
        </p>
      </>
    ),
  },
  {
    id: 'demo',
    index: '10',
    group: 'Integration',
    title: 'Live Demo',
    subtitle: 'Full Lifecycle in 38 Seconds',
    Figure: DemoFigure,
    docs: (
      <>
        <p>
          The demo runs the full RoboLedger lifecycle end-to-end on Hedera
          testnet&mdash;from robot registration to payment release&mdash;in
          38 seconds, costing $0.39 total.
        </p>
        <h4>Cost breakdown</h4>
        <div className="doc-type-grid">
          {[
            ['Robot NFT mint', '$0.05'],
            ['KYC grant', '$0.01'],
            ['Task post (HCS)', '$0.0001'],
            ['Bid submit (HCS)', '$0.0001'],
            ['Escrow lock', '$0.05'],
            ['Proof stream (5 msgs)', '$0.0005'],
            ['Validation (2 validators)', '$0.10'],
            ['Payment release', '$0.05'],
            ['Reputation update', '$0.05'],
          ].map(([step, cost]) => (
            <div key={step}>
              <code>{step}</code>
              <span>{cost}</span>
            </div>
          ))}
        </div>
        <h4>What judges can verify</h4>
        <ul>
          <li>All transactions visible on HashScan testnet explorer</li>
          <li>HCS messages with consensus timestamps and sequence numbers</li>
          <li>NFT metadata updates reflecting firmware changes</li>
          <li>Escrow contract state transitions (locked &rarr; released)</li>
          <li>Reputation scores queryable via Mirror Node REST API</li>
        </ul>
      </>
    ),
  },
]

/** Groups chapters by their group field, preserving insertion order. */
const chapterGroups = Array.from(
  chapters.reduce((map, ch) => {
    const list = map.get(ch.group) ?? []
    list.push(ch)
    map.set(ch.group, list)
    return map
  }, new Map<string, Chapter[]>()),
)

/** Connecting narratives between chapters. */
const chapterTransitions: Record<string, string> = {
  problem:
    'RoboLedger is the protocol — but why does it need to exist? The answer starts with a fundamental trust problem that every autonomous robot fleet faces today.',
  hedera:
    'The trust gap is real, and several projects are racing to fill it. But the chain you build on determines everything — cost, speed, and what primitives you get natively.',
  system:
    'With Hedera\'s native advantages established, let\'s look at how RoboLedger uses them. The architecture is five components working as one protocol.',
  identity:
    'The system starts with identity. Before a robot can bid on tasks or earn reputation, it needs a verifiable on-chain identity — and Hedera\'s token keys make this elegant.',
  marketplace:
    'With identity established, robots need work. The task marketplace uses HCS for fair-ordered bidding and smart contracts for trustless escrow.',
  proof:
    'A robot won the bid and locked escrow — but how do we know it actually did the work? This is where multi-party validation comes in.',
  reputation:
    'Validated work builds reputation. Every settlement and refund automatically updates the robot\'s on-chain score, creating a trustworthy feedback loop.',
  ros2:
    'Reputation depends on proof, and proof depends on sensor data. The ROS2 Bridge closes the loop by connecting physical robots directly to Hedera.',
  demo:
    'All five components working together. The live demo runs the full lifecycle — registration, bidding, escrow, proof, validation, payment, reputation — in 38 seconds.',
}

/** Main application component with IntersectionObserver scroll-spy. */
function App() {
  const [activeId, setActiveId] = useState<string>('intro')

  useEffect(() => {
    const ids = ['intro', ...chapters.map((ch) => ch.id)]
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -35% 0px', threshold: [0.15, 0.4, 0.65] },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const activeChapter = chapters.find((ch) => ch.id === activeId)
  const ActiveFigure = activeChapter?.Figure ?? IntroOverviewFigure
  const activeIndex = chapters.findIndex((ch) => ch.id === activeId)

  return (
    <div className="page">
      <div className="page-grid" />

      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-track">
          <div
            className="sidebar-fill"
            style={{
              height: `${((Math.max(activeIndex, 0) + 0.5) / chapters.length) * 100}%`,
            }}
          />
        </div>

        {chapterGroups.map(([group, items]) => (
          <div key={group} className="sidebar-group">
            <span className="sidebar-group-label">{group}</span>
            {items.map((ch) => {
              const idx = chapters.indexOf(ch)
              const isPast = activeIndex >= 0 && idx < activeIndex
              const isActive = ch.id === activeId

              return (
                <a
                  key={ch.id}
                  href={`#${ch.id}`}
                  className={`sidebar-item ${isActive ? 'is-active' : ''} ${isPast ? 'is-past' : ''}`}
                >
                  <span className="sidebar-dot" />
                  <span className="sidebar-index">{ch.index}</span>
                  <span className="sidebar-title">{ch.title}</span>
                </a>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Main grid: scrollable left + sticky right */}
      <main className="content">
        <div className="content-grid">
          {/* Left: scrollable text */}
          <div className="content-scroll">
            <header className="content-header">
              <div className="content-header__logo">
                <span>RoboLedger</span>
                <span>Architecture Atlas</span>
              </div>
            </header>

            {/* Intro */}
            <section id="intro" className="intro">
              <p className="intro-eyebrow">
                RoboLedger &mdash; Hedera Hackathon Submission
              </p>
              <h1 className="intro-title">
                ERC-8004 for physical robots&mdash;identity, tasks, proofs, and
                reputation on Hedera
              </h1>
              <p className="intro-body">
                Not a whitepaper. A fully built protocol with an SDK, CLI, ROS2
                bridge, smart contracts, and a live demo on Hedera
                testnet&mdash;proving that physical robots can have verifiable
                on-chain identity, fair-ordered task markets, multi-party proof
                validation, and reputation scoring at $0.0001 per message.
              </p>
              <div className="intro-stats">
                {[
                  ['$0.0001', 'per HCS msg'],
                  ['3s', 'aBFT finality'],
                  ['35', 'test cases'],
                  ['3', 'registries'],
                  ['5', 'components'],
                  ['38s', 'full demo'],
                ].map(([value, label]) => (
                  <div key={label} className="intro-stat">
                    <span className="intro-stat__value">{value}</span>
                    <span className="intro-stat__label">{label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Architecture walkthrough transition */}
            <section className="walkthrough-intro">
              <h2 className="walkthrough-title">
                Let&apos;s walk through the architecture
              </h2>
              <p className="walkthrough-body">
                RoboLedger is not a monolithic smart contract. It is a protocol
                of five specialized components, each solving a different part of
                the robot-to-blockchain problem. The following ten sections trace
                the full journey from problem statement to live
                demo&mdash;and explain every design decision along the way.
              </p>
            </section>

            {/* Chapters with connecting narratives */}
            {chapters.map((ch) => (
              <section
                key={ch.id}
                id={ch.id}
                className={`chapter ${ch.id === activeId ? 'is-active' : ''}`}
              >
                {chapterTransitions[ch.id] && (
                  <p className="chapter-transition">
                    {chapterTransitions[ch.id]}
                  </p>
                )}
                <div className="chapter-header">
                  <span className="chapter-number">{ch.index}</span>
                  <span className="chapter-subtitle">{ch.subtitle}</span>
                  <h2 className="chapter-title">{ch.title}</h2>
                </div>
                <div className="chapter-docs">{ch.docs}</div>
              </section>
            ))}

            <footer className="content-footer">
              <span>RoboLedger</span>
              <span>ERC-8004 &middot; Hedera Hackathon 2026</span>
              <span>github.com/robo-hedera</span>
            </footer>
          </div>

          {/* Right: sticky figure panel */}
          <aside className="content-sticky">
            <div className="figure-panel">
              <div className="figure-panel__header">
                <span>{activeChapter?.index ?? '00'}</span>
                <span>
                  {activeChapter?.subtitle ?? 'Architecture overview'}
                </span>
              </div>
              <div className="figure-panel__body" key={activeId}>
                <ActiveFigure />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

/** Intro figure — full system overview ReactFlow DAG shown before scrolling into chapters. */
function IntroOverviewFigure() {
  const nodes = useMemo<Node[]>(
    () => [
      {
        id: 'robots',
        position: { x: 160, y: 0 },
        data: { label: 'Physical Robots' },
        sourcePosition: Position.Bottom,
        type: 'input',
        style: introEdgeStyle,
      },
      {
        id: 'ros2',
        position: { x: 110, y: 90 },
        data: { label: 'ROS2 Bridge\nSensor → Hash → HCS' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: introStageStyle,
      },
      {
        id: 'hcs',
        position: { x: 10, y: 220 },
        data: { label: 'HCS Topics\nTasks · Bids · Proofs' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: introStageStyle,
      },
      {
        id: 'contracts',
        position: { x: 220, y: 220 },
        data: { label: 'Smart Contracts\nEscrow · Reputation · Validation' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: introStageStyle,
      },
      {
        id: 'hts',
        position: { x: 110, y: 360 },
        data: { label: 'HTS NFTs\nRobot Identity Registry' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: {
          ...introStageStyle,
          background: 'rgba(80,200,120,0.06)',
          borderColor: 'rgba(80,200,120,0.22)',
        },
      },
      {
        id: 'mirror',
        position: { x: 140, y: 480 },
        data: { label: 'Mirror Node + Dashboard' },
        targetPosition: Position.Top,
        type: 'output',
        style: introEdgeStyle,
      },
    ],
    [],
  )

  const edges = useMemo<Edge[]>(
    () => [
      makeEdge('robots', 'ros2'),
      makeEdge('ros2', 'hcs', 'proofs'),
      makeEdge('ros2', 'contracts'),
      makeEdge('hcs', 'hts', 'identity'),
      makeEdge('contracts', 'hts', 'escrow'),
      makeEdge('hts', 'mirror'),
    ],
    [],
  )

  return (
    <div className="figure intro-flow-figure">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={28} size={1} color="rgba(255,255,255,0.03)" />
      </ReactFlow>
    </div>
  )
}

/** 01 Hero — 3-column: HCS bytes (left) → Diamond transform (center) → Robot NFT + HBAR (right). */
function HeroFigure() {
  return (
    <div className="figure hero-figure">
      <div className="hero-figure__hex">
        {[
          '0A 1F 48 43',
          '53 20 4D 73',
          '67 3A 20 52',
          '6F 62 6F 74',
          '23 30 30 31',
        ].map((row, i) => (
          <span key={row} style={{ animationDelay: `${i * 0.35}s` }}>
            {row}
          </span>
        ))}
      </div>

      <div className="hero-figure__core">
        <div className="hero-figure__diamond" />
        <div className="hero-figure__label">RoboLedger</div>
        <div className="hero-figure__stream hero-figure__stream--in">
          {Array.from({ length: 4 }).map((_, i) => (
            <i key={i} style={{ animationDelay: `${i * 0.6}s` }} />
          ))}
        </div>
        <div className="hero-figure__stream hero-figure__stream--out">
          {Array.from({ length: 4 }).map((_, i) => (
            <i key={i} style={{ animationDelay: `${i * 0.6}s` }} />
          ))}
        </div>
      </div>

      <div className="hero-figure__code">
        {[
          'Robot NFT #001 — Certified',
          'Task: Deliver parcel → Escrow: 50 HBAR',
          'Proof validated (2/2)',
          'Payment released → Rep: 4.8★',
        ].map((line, i) => (
          <span key={line} style={{ animationDelay: `${i * 0.35}s` }}>
            {line}
          </span>
        ))}
      </div>
    </div>
  )
}

/** 02 Problem — ReactFlow DAG: isolated robots vs connected fleet. */
function ProblemFigure() {
  const nodes = useMemo<Node[]>(
    () => [
      {
        id: 'r1',
        position: { x: 0, y: 0 },
        data: { label: 'Robot A\n(unverified)' },
        style: { ...nodeStyle, borderColor: 'rgba(255,80,80,0.35)' },
      },
      {
        id: 'r2',
        position: { x: 180, y: 0 },
        data: { label: 'Robot B\n(unverified)' },
        style: { ...nodeStyle, borderColor: 'rgba(255,80,80,0.35)' },
      },
      {
        id: 'r3',
        position: { x: 360, y: 0 },
        data: { label: 'Robot C\n(unverified)' },
        style: { ...nodeStyle, borderColor: 'rgba(255,80,80,0.35)' },
      },
      {
        id: 'gap',
        position: { x: 120, y: 110 },
        data: { label: 'No shared identity · No trust · No coordination' },
        style: {
          ...nodeStyle,
          width: 300,
          borderColor: 'rgba(255,80,80,0.25)',
          background: 'rgba(255,80,80,0.08)',
          fontSize: '10px',
        },
      },
      {
        id: 'ledger',
        position: { x: 140, y: 220 },
        data: { label: 'RoboLedger Protocol' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: {
          ...nodeStyle,
          width: 260,
          borderColor: 'rgba(80,200,120,0.35)',
          background: 'rgba(80,200,120,0.08)',
        },
      },
      {
        id: 'r4',
        position: { x: 0, y: 340 },
        data: { label: 'Robot A\nNFT #001' },
        sourcePosition: Position.Top,
        style: { ...nodeStyle, borderColor: 'rgba(80,200,120,0.35)' },
      },
      {
        id: 'r5',
        position: { x: 180, y: 340 },
        data: { label: 'Robot B\nNFT #002' },
        sourcePosition: Position.Top,
        style: { ...nodeStyle, borderColor: 'rgba(80,200,120,0.35)' },
      },
      {
        id: 'r6',
        position: { x: 360, y: 340 },
        data: { label: 'Robot C\nNFT #003' },
        sourcePosition: Position.Top,
        style: { ...nodeStyle, borderColor: 'rgba(80,200,120,0.35)' },
      },
    ],
    [],
  )

  const edges = useMemo<Edge[]>(
    () => [
      makeEdge('ledger', 'r4'),
      makeEdge('ledger', 'r5'),
      makeEdge('ledger', 'r6'),
      makeEdge('r4', 'r5'),
      makeEdge('r5', 'r6'),
    ],
    [],
  )

  return (
    <div className="figure flow-figure">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={28} size={1} color="rgba(255,255,255,0.03)" />
      </ReactFlow>
    </div>
  )
}

/** 03 Hedera — ReactFlow comparison: Hedera vs peaq vs Ethereum (3 columns). */
function HederaFigure() {
  const nodes = useMemo<Node[]>(
    () => [
      {
        id: 'h-title',
        position: { x: 0, y: 0 },
        data: { label: 'Hedera' },
        sourcePosition: Position.Bottom,
        style: { ...nodeStyle, width: 130, borderColor: 'rgba(80,200,120,0.4)', background: 'rgba(80,200,120,0.08)' },
      },
      {
        id: 'h-hcs',
        position: { x: 0, y: 80 },
        data: { label: 'HCS\n$0.0001/msg' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: nodeStyle,
      },
      {
        id: 'h-hts',
        position: { x: 0, y: 170 },
        data: { label: 'HTS\nNative NFTs + Keys' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: nodeStyle,
      },
      {
        id: 'h-evm',
        position: { x: 0, y: 260 },
        data: { label: 'EVM Contracts\nEscrow + Reputation' },
        targetPosition: Position.Top,
        style: nodeStyle,
      },
      {
        id: 'p-title',
        position: { x: 180, y: 0 },
        data: { label: 'peaq' },
        sourcePosition: Position.Bottom,
        style: { ...nodeStyle, width: 130, borderColor: 'rgba(255,165,0,0.4)', background: 'rgba(255,165,0,0.06)' },
      },
      {
        id: 'p-did',
        position: { x: 180, y: 80 },
        data: { label: 'DID Pallet' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: nodeStyle,
      },
      {
        id: 'p-storage',
        position: { x: 180, y: 170 },
        data: { label: 'Storage Pallet\n+ RBAC Pallet' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: nodeStyle,
      },
      {
        id: 'p-ipfs',
        position: { x: 180, y: 260 },
        data: { label: 'IPFS\nOff-chain storage' },
        targetPosition: Position.Top,
        style: nodeStyle,
      },
      {
        id: 'e-title',
        position: { x: 360, y: 0 },
        data: { label: 'Ethereum' },
        sourcePosition: Position.Bottom,
        style: { ...nodeStyle, width: 130, borderColor: 'rgba(255,80,80,0.4)', background: 'rgba(255,80,80,0.06)' },
      },
      {
        id: 'e-nft',
        position: { x: 360, y: 80 },
        data: { label: 'ERC-721\nCustom contract' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: nodeStyle,
      },
      {
        id: 'e-oracle',
        position: { x: 360, y: 170 },
        data: { label: 'Custom Oracle\nChainlink / API3' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: nodeStyle,
      },
      {
        id: 'e-gas',
        position: { x: 360, y: 260 },
        data: { label: 'Gas Auction\n$0.50–$5.00/tx' },
        targetPosition: Position.Top,
        style: nodeStyle,
      },
    ],
    [],
  )

  const edges = useMemo<Edge[]>(
    () => [
      makeEdge('h-title', 'h-hcs'),
      makeEdge('h-hcs', 'h-hts'),
      makeEdge('h-hts', 'h-evm'),
      makeEdge('p-title', 'p-did'),
      makeEdge('p-did', 'p-storage'),
      makeEdge('p-storage', 'p-ipfs'),
      makeEdge('e-title', 'e-nft'),
      makeEdge('e-nft', 'e-oracle'),
      makeEdge('e-oracle', 'e-gas'),
    ],
    [],
  )

  return (
    <div className="figure flow-figure">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={28} size={1} color="rgba(255,255,255,0.03)" />
      </ReactFlow>
    </div>
  )
}

/** 04 System — Full system DAG: HCS → Contracts → SDK → CLI → ROS2 → Robots. */
function SystemFigure() {
  const nodes = useMemo<Node[]>(
    () => [
      {
        id: 'hcs-tasks',
        position: { x: 0, y: 0 },
        data: { label: 'HCS Topics\nTasks · Bids · Proofs' },
        sourcePosition: Position.Right,
        style: { ...nodeStyle, borderColor: 'rgba(80,200,120,0.3)' },
      },
      {
        id: 'contracts',
        position: { x: 200, y: 0 },
        data: { label: 'Smart Contracts\nEscrow · Reputation\nValidation' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Left,
        style: { ...nodeStyle, borderColor: 'rgba(100,149,237,0.3)' },
      },
      {
        id: 'sdk',
        position: { x: 200, y: 130 },
        data: { label: 'TypeScript SDK' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: nodeStyle,
      },
      {
        id: 'cli',
        position: { x: 100, y: 240 },
        data: { label: 'CLI' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: nodeStyle,
      },
      {
        id: 'ros2-bridge',
        position: { x: 300, y: 240 },
        data: { label: 'ROS2 Bridge' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: { ...nodeStyle, borderColor: 'rgba(255,165,0,0.3)' },
      },
      {
        id: 'robots',
        position: { x: 200, y: 350 },
        data: { label: 'Physical Robots' },
        targetPosition: Position.Top,
        style: { ...nodeStyle, borderColor: 'rgba(200,200,200,0.3)' },
      },
      {
        id: 'mirror',
        position: { x: 420, y: 70 },
        data: { label: 'Mirror Node' },
        targetPosition: Position.Left,
        style: { ...nodeStyle, width: 110, borderColor: 'rgba(150,150,255,0.3)' },
      },
      {
        id: 'dashboard',
        position: { x: 420, y: 170 },
        data: { label: 'Dashboard' },
        targetPosition: Position.Top,
        style: { ...nodeStyle, width: 110 },
      },
    ],
    [],
  )

  const edges = useMemo<Edge[]>(
    () => [
      makeEdge('hcs-tasks', 'contracts'),
      makeEdge('contracts', 'sdk'),
      makeEdge('sdk', 'cli'),
      makeEdge('sdk', 'ros2-bridge'),
      makeEdge('cli', 'robots'),
      makeEdge('ros2-bridge', 'robots'),
      makeEdge('contracts', 'mirror'),
      makeEdge('mirror', 'dashboard'),
    ],
    [],
  )

  return (
    <div className="figure flow-figure">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={28} size={1} color="rgba(255,255,255,0.03)" />
      </ReactFlow>
    </div>
  )
}

/** 05 Identity — ReactFlow: Manufacturer → Mint → Certifier → Robot Operates. */
function IdentityFigure() {
  const nodes = useMemo<Node[]>(
    () => [
      {
        id: 'manufacturer',
        position: { x: 0, y: 0 },
        data: { label: 'Manufacturer\n(supplyKey)' },
        sourcePosition: Position.Right,
        style: { ...nodeStyle, borderColor: 'rgba(100,149,237,0.35)' },
      },
      {
        id: 'mint',
        position: { x: 190, y: 0 },
        data: { label: 'Mint Robot NFT' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: { ...nodeStyle, borderColor: 'rgba(80,200,120,0.35)' },
      },
      {
        id: 'certifier',
        position: { x: 380, y: 0 },
        data: { label: 'Certifier\n(kycKey)' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Left,
        style: { ...nodeStyle, borderColor: 'rgba(255,215,0,0.35)' },
      },
      {
        id: 'operates',
        position: { x: 380, y: 110 },
        data: { label: 'Robot Operates\nKYC Approved' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: { ...nodeStyle, borderColor: 'rgba(80,200,120,0.35)', background: 'rgba(80,200,120,0.06)' },
      },
      {
        id: 'freeze',
        position: { x: 190, y: 200 },
        data: { label: 'Safety Authority\n(freezeKey)\nGround Robot' },
        targetPosition: Position.Top,
        style: { ...nodeStyle, borderColor: 'rgba(255,80,80,0.35)', background: 'rgba(255,80,80,0.06)' },
      },
      {
        id: 'firmware',
        position: { x: 0, y: 130 },
        data: { label: 'Robot Updates\nFirmware\n(metadataKey)' },
        targetPosition: Position.Top,
        style: { ...nodeStyle, borderColor: 'rgba(200,200,200,0.3)' },
      },
    ],
    [],
  )

  const edges = useMemo<Edge[]>(
    () => [
      makeEdge('manufacturer', 'mint', 'supplyKey'),
      makeEdge('mint', 'certifier', 'kycKey'),
      makeEdge('certifier', 'operates'),
      makeEdge('operates', 'freeze', 'freezeKey'),
      makeEdge('mint', 'firmware', 'metadataKey'),
    ],
    [],
  )

  return (
    <div className="figure flow-figure">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={28} size={1} color="rgba(255,255,255,0.03)" />
      </ReactFlow>
    </div>
  )
}

/** 06 Marketplace — ReactFlow: Client → HCS Tasks → Robots Bid → Winner → Escrow. */
function MarketplaceFigure() {
  const nodes = useMemo<Node[]>(
    () => [
      {
        id: 'client',
        position: { x: 0, y: 0 },
        data: { label: 'Client\nPosts Task' },
        sourcePosition: Position.Right,
        type: 'input',
        style: { ...nodeStyle, borderRadius: 999, borderColor: 'rgba(100,149,237,0.35)' },
      },
      {
        id: 'hcs-tasks',
        position: { x: 170, y: 0 },
        data: { label: 'HCS Tasks Topic' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Left,
        style: { ...nodeStyle, borderColor: 'rgba(80,200,120,0.35)' },
      },
      {
        id: 'robots-bid',
        position: { x: 40, y: 100 },
        data: { label: 'Robots Bid' },
        sourcePosition: Position.Right,
        style: { ...nodeStyle, borderColor: 'rgba(255,215,0,0.35)' },
      },
      {
        id: 'hcs-bids',
        position: { x: 210, y: 100 },
        data: { label: 'HCS Bids Topic\n(fair ordering)' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Left,
        style: { ...nodeStyle, borderColor: 'rgba(80,200,120,0.35)' },
      },
      {
        id: 'winner',
        position: { x: 120, y: 210 },
        data: { label: 'Winner Selected\nFair Ordering' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: { ...nodeStyle, width: 180, borderColor: 'rgba(255,215,0,0.35)', background: 'rgba(255,215,0,0.06)' },
      },
      {
        id: 'escrow',
        position: { x: 60, y: 310 },
        data: { label: 'Escrow Locks\nHBAR' },
        sourcePosition: Position.Right,
        targetPosition: Position.Top,
        style: { ...nodeStyle, borderColor: 'rgba(100,149,237,0.35)' },
      },
      {
        id: 'assigned',
        position: { x: 250, y: 310 },
        data: { label: 'Robot Assigned' },
        targetPosition: Position.Left,
        type: 'output',
        style: { ...nodeStyle, borderRadius: 999, borderColor: 'rgba(80,200,120,0.35)' },
      },
    ],
    [],
  )

  const edges = useMemo<Edge[]>(
    () => [
      makeEdge('client', 'hcs-tasks'),
      makeEdge('hcs-tasks', 'robots-bid'),
      makeEdge('robots-bid', 'hcs-bids'),
      makeEdge('hcs-bids', 'winner'),
      makeEdge('winner', 'escrow'),
      makeEdge('escrow', 'assigned'),
    ],
    [],
  )

  return (
    <div className="figure flow-figure">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={28} size={1} color="rgba(255,255,255,0.03)" />
      </ReactFlow>
    </div>
  )
}

/** 07 Proof — ReactFlow: Robot → HCS Proofs → Validators → Threshold → Payment → Reputation. */
function ProofFigure() {
  const nodes = useMemo<Node[]>(
    () => [
      {
        id: 'robot',
        position: { x: 0, y: 70 },
        data: { label: 'Robot\nStreams Proofs' },
        sourcePosition: Position.Right,
        style: { ...nodeStyle, borderColor: 'rgba(200,200,200,0.3)' },
      },
      {
        id: 'hcs-proofs',
        position: { x: 160, y: 70 },
        data: { label: 'HCS Proofs\nTopic' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: { ...nodeStyle, borderColor: 'rgba(80,200,120,0.35)' },
      },
      {
        id: 'v1',
        position: { x: 330, y: 0 },
        data: { label: 'Validator 1\nApproves' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Left,
        style: { ...nodeStyle, borderColor: 'rgba(255,215,0,0.35)' },
      },
      {
        id: 'v2',
        position: { x: 330, y: 110 },
        data: { label: 'Validator 2\nApproves' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Left,
        style: { ...nodeStyle, borderColor: 'rgba(255,215,0,0.35)' },
      },
      {
        id: 'threshold',
        position: { x: 300, y: 220 },
        data: { label: 'Threshold Met\n2/2' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: { ...nodeStyle, width: 160, borderColor: 'rgba(80,200,120,0.35)', background: 'rgba(80,200,120,0.06)' },
      },
      {
        id: 'payment',
        position: { x: 200, y: 320 },
        data: { label: 'Payment Released\nHBAR → Robot' },
        sourcePosition: Position.Right,
        targetPosition: Position.Top,
        style: { ...nodeStyle, borderColor: 'rgba(100,149,237,0.35)' },
      },
      {
        id: 'rep',
        position: { x: 400, y: 320 },
        data: { label: 'Reputation\nUpdated' },
        targetPosition: Position.Left,
        style: { ...nodeStyle, borderColor: 'rgba(255,165,0,0.35)' },
      },
    ],
    [],
  )

  const edges = useMemo<Edge[]>(
    () => [
      makeEdge('robot', 'hcs-proofs'),
      makeEdge('hcs-proofs', 'v1'),
      makeEdge('hcs-proofs', 'v2'),
      makeEdge('v1', 'threshold'),
      makeEdge('v2', 'threshold'),
      makeEdge('threshold', 'payment'),
      makeEdge('payment', 'rep'),
    ],
    [],
  )

  return (
    <div className="figure flow-figure">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={28} size={1} color="rgba(255,255,255,0.03)" />
      </ReactFlow>
    </div>
  )
}

/** 08 Reputation — Custom HTML/CSS: Robot card with score ring, feedback timeline, tags. */
function ReputationFigure() {
  const r = 52;
  const c = 2 * Math.PI * r;
  const score = 96;

  return (
    <div className="figure" style={{ padding: '2rem' }}>
      <svg viewBox="0 0 500 320" width="100%" height="100%" fill="none" style={{ maxHeight: '22rem' }}>
        {/* Background grid */}
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 45} x2="500" y2={i * 45} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        ))}

        {/* Score ring — animated fill */}
        <circle cx="100" cy="120" r={r + 10} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        <circle cx="100" cy="120" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle cx="100" cy="120" r={r} fill="none" stroke="rgba(80,200,120,0.6)" strokeWidth="5"
          strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} strokeLinecap="round"
          transform="rotate(-90 100 120)">
          <animate attributeName="stroke-dashoffset" from={c.toString()} to={(c - (score / 100) * c).toString()} dur="2s" fill="freeze" />
        </circle>
        <text x="100" y="115" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="22" fontWeight="600" fontFamily="JetBrains Mono, monospace">{score}%</text>
        <text x="100" y="135" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="JetBrains Mono, monospace" letterSpacing="0.15em">SUCCESS RATE</text>

        {/* Robot identity card */}
        <rect x="60" y="195" width="80" height="28" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <text x="100" y="213" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="JetBrains Mono, monospace">UNIT-001</text>
        <text x="100" y="245" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="JetBrains Mono, monospace">0.0.8348074</text>

        {/* Feedback timeline — animated entries */}
        {[
          { y: 40, score: 100, tag: 'taskSuccess', time: '2m', color: 'rgba(80,200,120,0.7)' },
          { y: 90, score: 100, tag: 'taskSuccess', time: '1h', color: 'rgba(80,200,120,0.6)' },
          { y: 140, score: 85, tag: 'deliverySpeed', time: '3h', color: 'rgba(80,200,120,0.5)' },
          { y: 190, score: 0, tag: 'taskFailed', time: '1d', color: 'rgba(255,80,80,0.6)' },
          { y: 240, score: 100, tag: 'taskSuccess', time: '2d', color: 'rgba(80,200,120,0.4)' },
        ].map((entry, i) => (
          <g key={i}>
            {/* Timeline dot */}
            <circle cx="220" cy={entry.y + 15} r="3" fill={entry.color}>
              <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
            </circle>
            {/* Connector line */}
            {i < 4 && <line x1="220" y1={entry.y + 20} x2="220" y2={entry.y + 50} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />}
            {/* Entry card */}
            <rect x="235" y={entry.y} width="250" height="30" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5">
              <animate attributeName="opacity" values="0;1" dur="0.5s" begin={`${i * 0.15}s`} fill="freeze" />
            </rect>
            {/* Score */}
            <text x="250" y={entry.y + 20} fill={entry.color} fontSize="12" fontWeight="600" fontFamily="JetBrains Mono, monospace">{entry.score}</text>
            {/* Tag */}
            <rect x="275" y={entry.y + 8} width="75" height="14" rx="7" fill="rgba(255,255,255,0.05)" />
            <text x="312" y={entry.y + 19} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="JetBrains Mono, monospace">{entry.tag}</text>
            {/* Time */}
            <text x="470" y={entry.y + 20} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="JetBrains Mono, monospace">{entry.time}</text>
          </g>
        ))}

        {/* Header labels */}
        <text x="220" y="295" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="JetBrains Mono, monospace" letterSpacing="0.2em">FEEDBACK TIMELINE</text>
        <text x="100" y="275" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="JetBrains Mono, monospace" letterSpacing="0.2em">REPUTATION SCORE</text>

        {/* Tag filters at bottom */}
        {['taskSuccess', 'deliverySpeed', 'taskFailed', 'proofQuality'].map((tag, i) => (
          <g key={tag}>
            <rect x={240 + i * 65} y={300} width="58" height="16" rx="8" fill={i === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            <text x={269 + i * 65} y={311} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="6" fontFamily="JetBrains Mono, monospace">{tag}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/** 09 ROS2 — ReactFlow: ROS2 Topics → Bridge Node → Hash → CLI → HCS. */
function ROS2Figure() {
  const nodes = useMemo<Node[]>(
    () => [
      {
        id: 'odom',
        position: { x: 0, y: 0 },
        data: { label: '/odom' },
        sourcePosition: Position.Right,
        style: { ...nodeStyle, width: 100, borderRadius: 999, borderColor: 'rgba(255,165,0,0.35)' },
      },
      {
        id: 'gps',
        position: { x: 0, y: 70 },
        data: { label: '/gps' },
        sourcePosition: Position.Right,
        style: { ...nodeStyle, width: 100, borderRadius: 999, borderColor: 'rgba(255,165,0,0.35)' },
      },
      {
        id: 'camera',
        position: { x: 0, y: 140 },
        data: { label: '/camera' },
        sourcePosition: Position.Right,
        style: { ...nodeStyle, width: 100, borderRadius: 999, borderColor: 'rgba(255,165,0,0.35)' },
      },
      {
        id: 'bridge',
        position: { x: 150, y: 50 },
        data: { label: 'ROS2 Bridge Node\n(rclpy)' },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: { ...nodeStyle, width: 150, borderColor: 'rgba(100,149,237,0.35)' },
      },
      {
        id: 'hash',
        position: { x: 350, y: 20 },
        data: { label: 'SHA-256\nHash' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Left,
        style: { ...nodeStyle, width: 100, borderColor: 'rgba(200,200,200,0.3)' },
      },
      {
        id: 'cli',
        position: { x: 350, y: 120 },
        data: { label: 'CLI\nSubprocess' },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        style: nodeStyle,
      },
      {
        id: 'hcs-proofs',
        position: { x: 320, y: 230 },
        data: { label: 'HCS Proofs Topic' },
        targetPosition: Position.Top,
        type: 'output',
        style: { ...nodeStyle, width: 160, borderRadius: 999, borderColor: 'rgba(80,200,120,0.35)' },
      },
      {
        id: 'hcs-tasks',
        position: { x: 140, y: 200 },
        data: { label: 'HCS Tasks Topic' },
        sourcePosition: Position.Bottom,
        style: { ...nodeStyle, width: 140, borderColor: 'rgba(80,200,120,0.35)' },
      },
      {
        id: 'task-node',
        position: { x: 0, y: 280 },
        data: { label: '/roboledger/\navailable_tasks' },
        targetPosition: Position.Top,
        style: { ...nodeStyle, width: 140, borderRadius: 999, borderColor: 'rgba(255,215,0,0.35)' },
      },
    ],
    [],
  )

  const edges = useMemo<Edge[]>(
    () => [
      makeEdge('odom', 'bridge'),
      makeEdge('gps', 'bridge'),
      makeEdge('camera', 'bridge'),
      makeEdge('bridge', 'hash'),
      makeEdge('hash', 'cli'),
      makeEdge('cli', 'hcs-proofs'),
      makeEdge('hcs-tasks', 'task-node', 'subscribe'),
    ],
    [],
  )

  return (
    <div className="figure flow-figure">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={28} size={1} color="rgba(255,255,255,0.03)" />
      </ReactFlow>
    </div>
  )
}

/** 10 Demo — Custom HTML: 8-step summary with checkmarks, cost breakdown, HashScan links. */
function DemoFigure() {
  const steps = [
    { label: 'Verify Fleet', cost: '$0.00', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
    { label: 'Post Task', cost: '$0.0001', icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z' },
    { label: 'Robot Bids', cost: '$0.0002', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2' },
    { label: 'Lock Escrow', cost: '$0.065', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { label: 'Stream Proofs', cost: '$0.0003', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z' },
    { label: 'Validate 2/2', cost: '$0.13', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Settle + Rep', cost: '$0.065', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
    { label: 'Verify State', cost: '$0.00', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  ];

  return (
    <div className="figure" style={{ padding: '1.5rem' }}>
      <svg viewBox="0 0 500 340" width="100%" height="100%" fill="none" style={{ maxHeight: '22rem' }}>
        {/* Background */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={i} x1="0" y1={i * 42} x2="500" y2={i * 42} stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
        ))}

        {/* Title */}
        <text x="250" y="20" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="JetBrains Mono, monospace" letterSpacing="0.2em">FULL LIFECYCLE — 38 SECONDS</text>

        {/* Step pipeline — 2 columns x 4 rows */}
        {steps.map((step, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = col === 0 ? 60 : 280;
          const y = 45 + row * 70;

          return (
            <g key={i}>
              {/* Connection to next step */}
              {i < 7 && (() => {
                const nextCol = (i + 1) % 2;
                const nextRow = Math.floor((i + 1) / 2);
                const nx = nextCol === 0 ? 60 : 280;
                const ny = 45 + nextRow * 70;
                return (
                  <line x1={x + 85} y1={y + 22} x2={nx + 85} y2={ny + 22}
                    stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 3" />
                );
              })()}

              {/* Step card */}
              <rect x={x} y={y} width="170" height="44" rx="6"
                fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5">
                <animate attributeName="stroke" values="rgba(255,255,255,0.08);rgba(80,200,120,0.4);rgba(80,200,120,0.15)" dur="0.5s" begin={`${i * 0.4}s`} fill="freeze" />
              </rect>

              {/* Step number circle */}
              <circle cx={x + 20} cy={y + 22} r="10" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5">
                <animate attributeName="fill" values="rgba(255,255,255,0.05);rgba(80,200,120,0.15)" dur="0.3s" begin={`${i * 0.4}s`} fill="freeze" />
              </circle>
              <text x={x + 20} y={y + 26} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="JetBrains Mono, monospace">{i + 1}</text>

              {/* Check that appears after animation */}
              <text x={x + 20} y={y + 26} textAnchor="middle" fill="rgba(80,200,120,0.8)" fontSize="11" fontFamily="sans-serif" opacity="0">
                ✓
                <animate attributeName="opacity" values="0;1" dur="0.2s" begin={`${i * 0.4 + 0.3}s`} fill="freeze" />
              </text>

              {/* Label */}
              <text x={x + 40} y={y + 19} fill="rgba(255,255,255,0.7)" fontSize="10" fontFamily="Inter, sans-serif">{step.label}</text>
              {/* Cost */}
              <text x={x + 40} y={y + 33} fill="rgba(255,255,255,0.25)" fontSize="8" fontFamily="JetBrains Mono, monospace">{step.cost}</text>
            </g>
          );
        })}

        {/* Progress bar at bottom */}
        <rect x="60" y="330" width="380" height="3" rx="1.5" fill="rgba(255,255,255,0.05)" />
        <rect x="60" y="330" width="0" height="3" rx="1.5" fill="rgba(80,200,120,0.4)">
          <animate attributeName="width" from="0" to="380" dur="3.2s" fill="freeze" />
        </rect>

        {/* Total cost box */}
        <rect x="180" y="295" width="140" height="28" rx="14" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <text x="220" y="313" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="JetBrains Mono, monospace">Total:</text>
        <text x="270" y="313" fill="rgba(255,255,255,0.8)" fontSize="11" fontWeight="600" fontFamily="JetBrains Mono, monospace">$0.39</text>

        {/* HashScan badges */}
        {['NFT', 'HCS', 'Contract', 'Mirror'].map((badge, i) => (
          <g key={badge}>
            <rect x={140 + i * 60} y={268} width="50" height="18" rx="9" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <text x={165 + i * 60} y={280} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="JetBrains Mono, monospace">{badge}</text>
          </g>
        ))}
        <text x="250" y="260" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="JetBrains Mono, monospace" letterSpacing="0.15em">VERIFY ON HASHSCAN</text>
      </svg>
    </div>
  )
}

/** Shared dark node style for ReactFlow figures. */
const nodeStyle: React.CSSProperties = {
  width: 140,
  borderRadius: 0,
  padding: '10px 12px',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.05)',
  color: 'rgba(255,255,255,0.8)',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '10px',
  lineHeight: 1.5,
  whiteSpace: 'pre-line' as const,
}

/** Stage style for intro overview DAG. */
const introStageStyle: React.CSSProperties = {
  width: 190,
  borderRadius: 0,
  padding: '14px 16px',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.05)',
  color: 'rgba(255,255,255,0.8)',
  fontFamily: 'Inter, sans-serif',
  fontSize: '11px',
  lineHeight: 1.5,
  whiteSpace: 'pre-line' as const,
}

/** Pill style for intro overview terminal nodes. */
const introEdgeStyle: React.CSSProperties = {
  width: 140,
  borderRadius: 999,
  padding: '10px 16px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.65)',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: '10px',
  fontWeight: 500,
}

/** Creates a smoothstep edge with consistent styling. */
function makeEdge(source: string, target: string, label?: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    target,
    label,
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'rgba(255,255,255,0.35)',
      width: 16,
      height: 16,
    },
    style: { stroke: 'rgba(255,255,255,0.25)', strokeWidth: 1.2 },
    labelStyle: {
      fill: 'rgba(255,255,255,0.55)',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 9,
      letterSpacing: '0.14em',
    },
    labelBgStyle: {
      fill: 'rgba(20,20,25,0.85)',
      fillOpacity: 1,
    },
  }
}

export default App;
export { App as Archi };
