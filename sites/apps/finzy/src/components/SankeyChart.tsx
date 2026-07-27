import { useMemo } from 'react';
import { formatAmount } from '@/lib/formatCurrency';
import type { Currency } from '@/types';

interface SankeyChartProps {
  income: number;
  expenses: { category: string; amount: number }[];
  savings: number;
  currency: Currency;
}

const COLORS = {
  income: '#10B981',
  savings: '#3B82F6',
  expenses: ['#EF4444', '#F97316', '#EAB308', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#6366F1', '#14B8A6', '#F43F5E'],
};

export function SankeyChart({ income, expenses, savings, currency }: SankeyChartProps) {
  const sortedExpenses = useMemo(() => 
    [...expenses].filter(e => e.amount > 0).sort((a, b) => b.amount - a.amount),
    [expenses]
  );

  if (income <= 0) return null;

  const width = 600;
  const nodeWidth = 20;
  const nodePadding = 8;
  const topMargin = 40;
  const bottomMargin = 35;
  const minNodeHeight = 28;
  
  const nodeCount = sortedExpenses.length + (savings > 0 ? 1 : 0);
  
  // Calculer la hauteur réelle nécessaire pour les nœuds de droite
  const rightNodesData = useMemo(() => {
    const totalRight = sortedExpenses.reduce((s, e) => s + e.amount, 0) + (savings > 0 ? savings : 0);
    const items: { id: string; label: string; value: number; color: string; height: number; pct: number }[] = [];

    sortedExpenses.forEach((exp, i) => {
      const proportionalHeight = (exp.amount / totalRight) * 300;
      items.push({
        id: `exp-${i}`,
        label: exp.category,
        value: exp.amount,
        color: COLORS.expenses[i % COLORS.expenses.length],
        height: Math.max(minNodeHeight, proportionalHeight),
        pct: income > 0 ? Math.round((exp.amount / income) * 100) : 0,
      });
    });

    if (savings > 0) {
      const proportionalHeight = (savings / totalRight) * 300;
      items.push({
        id: 'savings',
        label: 'Épargne',
        value: savings,
        color: COLORS.savings,
        height: Math.max(minNodeHeight, proportionalHeight),
        pct: income > 0 ? Math.round((savings / income) * 100) : 0,
      });
    }

    return items;
  }, [sortedExpenses, savings, income]);

  // Hauteur totale nécessaire pour les nœuds de droite
  const totalRightHeight = rightNodesData.reduce((sum, node) => sum + node.height, 0) + (nodeCount - 1) * nodePadding;
  const height = topMargin + totalRightHeight + bottomMargin;

  const leftX = 80;
  const rightX = width - 200;

  // Positionner les nœuds de droite
  const rightNodes = useMemo(() => {
    let y = topMargin;
    return rightNodesData.map((node) => {
      const positioned = { ...node, y };
      y += node.height + nodePadding;
      return positioned;
    });
  }, [rightNodesData, topMargin]);

  // Calculer les positions de départ sur le noeud gauche
  const getSourcePositions = (nodeIndex: number) => {
    const totalValue = rightNodes.reduce((s, n) => s + n.value, 0);
    let startPct = 0;
    for (let i = 0; i < nodeIndex; i++) {
      startPct += rightNodes[i].value / totalValue;
    }
    const endPct = startPct + rightNodes[nodeIndex].value / totalValue;
    return {
      y1: topMargin + startPct * totalRightHeight,
      y2: topMargin + endPct * totalRightHeight,
    };
  };

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          {rightNodes.map((node) => (
            <linearGradient key={`grad-${node.id}`} id={`grad-${node.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={COLORS.income} stopOpacity={0.5} />
              <stop offset="100%" stopColor={node.color} stopOpacity={0.5} />
            </linearGradient>
          ))}
        </defs>

        {/* Income node (left) */}
        <rect x={leftX} y={topMargin} width={nodeWidth} height={totalRightHeight} rx={4} fill={COLORS.income} />
        <text x={leftX + nodeWidth / 2} y={topMargin - 12} textAnchor="middle" className="fill-foreground text-xs font-semibold">
          Revenus
        </text>
        <text x={leftX + nodeWidth / 2} y={topMargin + totalRightHeight + 18} textAnchor="middle" className="fill-muted-foreground text-[11px]">
          {formatAmount(income, currency)}
        </text>

        {/* Links and right nodes */}
        {rightNodes.map((node, i) => {
          const { y1, y2 } = getSourcePositions(i);
          const controlOffset = (rightX - leftX - nodeWidth) * 0.4;

          return (
            <g key={node.id}>
              {/* Flow path with smooth bezier curves */}
              <path
                d={`
                  M ${leftX + nodeWidth} ${y1}
                  C ${leftX + nodeWidth + controlOffset} ${y1}, 
                    ${rightX - controlOffset} ${node.y}, 
                    ${rightX} ${node.y}
                  L ${rightX} ${node.y + node.height}
                  C ${rightX - controlOffset} ${node.y + node.height}, 
                    ${leftX + nodeWidth + controlOffset} ${y2}, 
                    ${leftX + nodeWidth} ${y2}
                  Z
                `}
                fill={`url(#grad-${node.id})`}
                className="transition-opacity duration-200 hover:opacity-70 cursor-pointer"
              />
              
              {/* Right node bar */}
              <rect 
                x={rightX} 
                y={node.y} 
                width={nodeWidth} 
                height={node.height} 
                rx={4} 
                fill={node.color} 
              />
              
              {/* Category label */}
              <text 
                x={rightX + nodeWidth + 10} 
                y={node.y + node.height / 2 - 2} 
                className="fill-foreground text-[11px] font-medium"
                dominantBaseline="middle"
              >
                {node.label}
              </text>
              
              {/* Amount and percentage */}
              <text 
                x={rightX + nodeWidth + 10} 
                y={node.y + node.height / 2 + 12} 
                className="fill-muted-foreground text-[10px]"
                dominantBaseline="middle"
              >
                {formatAmount(node.value, currency)} ({node.pct}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Composant pour le patrimoine
interface PatrimoineSankeyProps {
  totalAssets: number;
  categories: { name: string; value: number; color: string }[];
  currency: Currency;
}

export function PatrimoineSankey({ totalAssets, categories, currency }: PatrimoineSankeyProps) {
  const sortedCategories = useMemo(() => 
    [...categories].filter(c => c.value > 0).sort((a, b) => b.value - a.value),
    [categories]
  );

  if (totalAssets <= 0 || sortedCategories.length === 0) return null;

  const width = 600;
  const nodeWidth = 20;
  const nodePadding = 10;
  const topMargin = 40;
  const bottomMargin = 35;
  const minNodeHeight = 35;
  
  const nodeCount = sortedCategories.length;

  // Calculer la hauteur réelle nécessaire pour les nœuds de droite
  const rightNodesData = useMemo(() => {
    return sortedCategories.map((cat, i) => {
      const proportionalHeight = (cat.value / totalAssets) * 300;
      return {
        id: `cat-${i}`,
        label: cat.name,
        value: cat.value,
        color: cat.color,
        height: Math.max(minNodeHeight, proportionalHeight),
        pct: Math.round((cat.value / totalAssets) * 100),
      };
    });
  }, [sortedCategories, totalAssets]);

  // Hauteur totale nécessaire pour les nœuds de droite
  const totalRightHeight = rightNodesData.reduce((sum, node) => sum + node.height, 0) + (nodeCount - 1) * nodePadding;
  const height = topMargin + totalRightHeight + bottomMargin;

  const leftX = 100;
  const rightX = width - 180;

  // Positionner les nœuds de droite
  const rightNodes = useMemo(() => {
    let y = topMargin;
    return rightNodesData.map((node) => {
      const positioned = { ...node, y };
      y += node.height + nodePadding;
      return positioned;
    });
  }, [rightNodesData, topMargin]);

  const getSourcePositions = (nodeIndex: number) => {
    let startPct = 0;
    for (let i = 0; i < nodeIndex; i++) {
      startPct += sortedCategories[i].value / totalAssets;
    }
    const endPct = startPct + sortedCategories[nodeIndex].value / totalAssets;
    return {
      y1: topMargin + startPct * totalRightHeight,
      y2: topMargin + endPct * totalRightHeight,
    };
  };

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          {rightNodes.map((node) => (
            <linearGradient key={`grad-pat-${node.id}`} id={`grad-pat-${node.id}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
              <stop offset="100%" stopColor={node.color} stopOpacity={0.5} />
            </linearGradient>
          ))}
        </defs>

        {/* Total assets node (left) */}
        <rect x={leftX} y={topMargin} width={nodeWidth} height={totalRightHeight} rx={4} fill="#3B82F6" />
        <text x={leftX + nodeWidth / 2} y={topMargin - 12} textAnchor="middle" className="fill-foreground text-xs font-semibold">
          Patrimoine
        </text>
        <text x={leftX + nodeWidth / 2} y={topMargin + totalRightHeight + 18} textAnchor="middle" className="fill-muted-foreground text-[11px]">
          {formatAmount(totalAssets, currency)}
        </text>

        {/* Links and category nodes */}
        {rightNodes.map((node, i) => {
          const { y1, y2 } = getSourcePositions(i);
          const controlOffset = (rightX - leftX - nodeWidth) * 0.4;

          return (
            <g key={node.id}>
              <path
                d={`
                  M ${leftX + nodeWidth} ${y1}
                  C ${leftX + nodeWidth + controlOffset} ${y1}, 
                    ${rightX - controlOffset} ${node.y}, 
                    ${rightX} ${node.y}
                  L ${rightX} ${node.y + node.height}
                  C ${rightX - controlOffset} ${node.y + node.height}, 
                    ${leftX + nodeWidth + controlOffset} ${y2}, 
                    ${leftX + nodeWidth} ${y2}
                  Z
                `}
                fill={`url(#grad-pat-${node.id})`}
                className="transition-opacity duration-200 hover:opacity-70 cursor-pointer"
              />
              
              <rect 
                x={rightX} 
                y={node.y} 
                width={nodeWidth} 
                height={node.height} 
                rx={4} 
                fill={node.color} 
              />
              
              <text 
                x={rightX + nodeWidth + 10} 
                y={node.y + node.height / 2 - 2} 
                className="fill-foreground text-[12px] font-medium"
                dominantBaseline="middle"
              >
                {node.label}
              </text>
              
              <text 
                x={rightX + nodeWidth + 10} 
                y={node.y + node.height / 2 + 14} 
                className="fill-muted-foreground text-[10px]"
                dominantBaseline="middle"
              >
                {formatAmount(node.value, currency)} ({node.pct}%)
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
