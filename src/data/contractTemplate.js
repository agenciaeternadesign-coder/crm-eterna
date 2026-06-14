const fmt = (v) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(v || 0)

const fmtDate = (d) => {
  if (!d) return '___/___/______'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// ================================================================
// MODELO DO CONTRATO — PLACEHOLDER
// Quando tiver o texto real do seu contrato, envie para o assistente
// e ele substituirá o conteúdo desta função mantendo as variáveis.
// Os campos entre ${} são preenchidos automaticamente.
// ================================================================
export function generateContractHTML({
  clientName, clientNIF, clientAddress, clientEmail, clientPhone,
  serviceDescription, totalValue, paymentDescription,
  contractDate, startDate, endDate,
  companyName, companyNIF, companyAddress,
}) {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; color: #1a1a1a;">

      <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="font-size: 14pt; font-weight: bold; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 8px 0;">
          Contrato de Prestação de Serviços
        </h1>
        <p style="font-size: 10pt; color: #666; margin: 0;">
          Data: ${fmtDate(contractDate)}
        </p>
      </div>

      <p style="margin-bottom: 8px;">
        <strong>${companyName || 'NOME DA EMPRESA'}</strong>${companyNIF ? `, NIF ${companyNIF}` : ''}${companyAddress ? `, com sede em ${companyAddress}` : ''},
        doravante denominada <strong>PRESTADORA</strong>,
      </p>

      <p style="text-align: center; margin: 16px 0; font-weight: bold;">e</p>

      <p style="margin-bottom: 8px;">
        <strong>${clientName || '___________________'}</strong>${clientNIF ? `, portador(a) do documento n.º ${clientNIF}` : ''},
        ${clientAddress ? `residente em ${clientAddress}` : ''}${clientEmail ? `, e-mail: ${clientEmail}` : ''}${clientPhone ? `, telefone: ${clientPhone}` : ''},
        doravante denominada <strong>CLIENTE</strong>,
      </p>

      <p style="margin-top: 16px;">
        têm entre si justo e acordado o presente Contrato de Prestação de Serviços,
        que se regerá pelas seguintes cláusulas:
      </p>

      <hr style="margin: 28px 0; border: none; border-top: 1px solid #aaa;" />

      <h2 style="font-size: 12pt; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px;">
        Cláusula 1.ª — Objeto
      </h2>
      <p>A PRESTADORA compromete-se a executar os seguintes serviços para a CLIENTE:</p>
      <blockquote style="margin: 12px 0; padding: 12px 20px; border-left: 3px solid #999; background: #f8f8f8; font-style: italic;">
        ${serviceDescription || '[Descrição do serviço a ser prestado]'}
      </blockquote>

      <h2 style="font-size: 12pt; text-transform: uppercase; letter-spacing: 1px; margin-top: 28px;">
        Cláusula 2.ª — Prazo
      </h2>
      <p>
        O presente contrato tem início em <strong>${fmtDate(startDate)}</strong>
        e término em <strong>${fmtDate(endDate)}</strong>.
      </p>

      <h2 style="font-size: 12pt; text-transform: uppercase; letter-spacing: 1px; margin-top: 28px;">
        Cláusula 3.ª — Valor e Forma de Pagamento
      </h2>
      <p>
        O valor total acordado é de <strong>${fmt(totalValue)}</strong>,
        a ser pago da seguinte forma:
      </p>
      <blockquote style="margin: 12px 0; padding: 12px 20px; border-left: 3px solid #999; background: #f8f8f8; font-style: italic;">
        ${paymentDescription || '[Forma de pagamento]'}
      </blockquote>

      <h2 style="font-size: 12pt; text-transform: uppercase; letter-spacing: 1px; margin-top: 28px;">
        Cláusula 4.ª — Rescisão
      </h2>
      <p>
        Este contrato poderá ser rescindido por qualquer das partes mediante aviso prévio
        de 15 (quinze) dias, por escrito, sem prejuízo das obrigações já assumidas.
      </p>

      <h2 style="font-size: 12pt; text-transform: uppercase; letter-spacing: 1px; margin-top: 28px;">
        Cláusula 5.ª — Foro
      </h2>
      <p>
        As partes elegem o foro da comarca do domicílio da PRESTADORA para dirimir
        quaisquer dúvidas ou litígios decorrentes do presente contrato.
      </p>

      <p style="margin-top: 48px;">
        E, por estarem assim justas e acordadas, as partes assinam o presente instrumento
        em 2 (duas) vias de igual teor e forma.
      </p>

      <p style="text-align: right; margin-top: 8px; color: #555;">
        ${contractDate ? fmtDate(contractDate) : '_____ de ________________ de _______'}
      </p>

      <div style="display: flex; justify-content: space-between; margin-top: 64px; gap: 40px;">
        <div style="text-align: center; flex: 1;">
          <div style="border-top: 1px solid #333; padding-top: 10px; margin-top: 50px;">
            <p style="margin: 0; font-weight: bold;">${companyName || 'PRESTADORA'}</p>
            ${companyNIF ? `<p style="margin: 2px 0 0 0; font-size: 10pt; color: #666;">NIF: ${companyNIF}</p>` : ''}
          </div>
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="border-top: 1px solid #333; padding-top: 10px; margin-top: 50px;">
            <p style="margin: 0; font-weight: bold;">${clientName || 'CLIENTE'}</p>
            ${clientNIF ? `<p style="margin: 2px 0 0 0; font-size: 10pt; color: #666;">NIF/BI: ${clientNIF}</p>` : ''}
          </div>
        </div>
      </div>

    </div>
  `
}

export function buildPaymentDescription({ paymentMethod, totalValue, installments, paymentDate, firstPaymentDate }) {
  const val = parseFloat(totalValue) || 0
  const fmtD = (d) => (d ? d.split('-').reverse().join('/') : '___/___/______')

  if (paymentMethod === 'parcelado') {
    const n = parseInt(installments) || 1
    const parcel = val / n
    return `Pagamento em ${n} parcela${n > 1 ? 's' : ''} de ${fmt(parcel)} cada, sendo a primeira com vencimento em ${fmtD(firstPaymentDate)} e as demais nos meses subsequentes.`
  }
  if (paymentMethod === 'avista') {
    return `Pagamento à vista no valor de ${fmt(val)}, a ser efetuado até ${fmtD(paymentDate)}.`
  }
  return `Pagamento via transferência bancária no valor de ${fmt(val)}, a ser efetuado até ${fmtD(paymentDate)}.`
}

export function buildPaymentSchedule({ paymentMethod, totalValue, installments, paymentDate, firstPaymentDate }) {
  const val = parseFloat(totalValue) || 0
  const n = parseInt(installments) || 1

  if (paymentMethod === 'parcelado' && n > 1) {
    const base = firstPaymentDate ? new Date(firstPaymentDate + 'T12:00:00') : new Date()
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(base)
      d.setMonth(d.getMonth() + i)
      return {
        id: `${Date.now()}_${i}`,
        date: d.toISOString().split('T')[0],
        amount: val / n,
        description: `Parcela ${i + 1}/${n}`,
        paid: false,
      }
    })
  }

  return [{
    id: `${Date.now()}_0`,
    date: paymentDate || '',
    amount: val,
    description: paymentMethod === 'avista' ? 'Pagamento à vista' : 'Transferência bancária',
    paid: false,
  }]
}
