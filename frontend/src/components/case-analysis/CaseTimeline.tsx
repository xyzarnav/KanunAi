'use client';

import React, { useMemo } from 'react';
import CustomTimeline from './CustomTimeline';

interface TimelineEvent {
  readonly id: string;
  readonly eventName: string;
  readonly date: string;
  readonly eventType: string;
  readonly context?: string;
  readonly summary?: string; // Gemini's 2-line summary (from refactoring)
  readonly parsed_result_short?: string; // Legacy field - Gemini's 2-line simplified summary
}

interface CaseTimelineProps {
  readonly parsedResult?: {
    readonly events: readonly TimelineEvent[];
  };
}

export default function CaseTimeline({ parsedResult = { events: [] } }: CaseTimelineProps) {
  const { events } = parsedResult;

  // Utility functions
  const cleanText = (text: string, maxLength: number = 120): string => {
    return text
      .replaceAll(/[:"]/g, '') // Remove colons and quotes
      .replaceAll(/\s+/g, ' ') // Normalize spaces
      .trim()
      .substring(0, maxLength);
  };

  // Interface for Gemini summarized result
  interface GeminiSummarizedEvent {
    id: string;
    date: string;
    summary: string;
    shortSummary?: string; // 2-line simplified summary from Gemini
  }

  // Extract summary from event - prioritize refactored summary from Gemini
  const extractSummary = (event: TimelineEvent): string[] => {
    // First priority: Use the summary field from refactored events (2-line summary from Gemini)
    if (event.summary) {
      // Split summary into lines, ensuring max 2 lines
      const lines = event.summary.split('\n').filter(line => line.trim()).slice(0, 2);
      return lines.length > 0 ? lines : [];
    }
    
    // Second priority: Legacy parsed_result_short field
    if (event.parsed_result_short) {
      return [event.parsed_result_short];
    }

    // Fallback: Create natural language summary from context (no dates, 1-2 lines)
    if (event.context) {
      let context = event.context;
      
      // Aggressively clean context
      context = context
        .replace(/--- PAGE BREAK ---/g, ' ')
        .replace(/PAGE BREAK/g, ' ')
        .replace(/MANU\/[^\s]+/g, '') // Remove citations
        .replace(/https?:\/\/\S+/g, '') // Remove URLs
        .replace(/\d+\s+Decided by.*?High Court/gi, '') // Remove "X Decided by..."
        .replace(/\d+\s+K\.\s+\w+.*?v\.\s+.*?\d{4}/g, '') // Remove case citations
        .replace(/Criminal Appeal No\.?\s*\d+.*?of \d{4}/gi, '') // Remove appeal citations
        .replace(/IN THE.*?SUPREME COURT.*?\d{4}/gis, '') // Remove header text
        .replace(/Decided On:.*?\d{2}\.\d{2}\.\d{4}/gi, '') // Remove "Decided On: date"
        .replace(/decided vide.*?\d{4}/gi, '') // Remove "decided vide..."
        .replace(/\d{1,2}\.\d{1,2}\.\d{4}/g, '') // Remove all dates
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      const contextLower = context.toLowerCase();
      
      // Extract amounts with recipient info
      const amountRegex = /Rs\.\s*([0-9,]+(?:\.[0-9]+)?)/g;
      const amountMatches: Array<{ amount: string; recipient?: string }> = [];
      let match;
      while ((match = amountRegex.exec(event.context)) !== null) {
        const start = Math.max(0, match.index - 80);
        const end = Math.min(event.context.length, match.index + match[0].length + 80);
        const snippet = event.context.substring(start, end).toLowerCase();
        
        let recipient: string | undefined;
        if (snippet.includes('wife') || snippet.includes('respondent no. 1') || snippet.includes('respondent no.1')) {
          recipient = 'the wife';
        } else if (snippet.includes('son') || snippet.includes('respondent no. 2') || snippet.includes('respondent no.2') || snippet.includes('minor son')) {
          recipient = 'the son';
        } else if (snippet.includes('husband') || snippet.includes('appellant')) {
          recipient = 'the husband';
        }
        
        amountMatches.push({ amount: match[0], recipient });
      }
      
      // Extract sections
      const sectionMatch = context.match(/Section\s+(\d+(?:[A-Za-z])?)\s+(?:of\s+)?(?:the\s+)?(?:HMA|Hindu\s+Marriage\s+Act|Code\s+of\s+Criminal\s+Procedure|CrPC)/i);
      const sectionInfo = sectionMatch 
        ? (contextLower.includes('hma') || contextLower.includes('hindu marriage')
           ? `Section ${sectionMatch[1]} of the Hindu Marriage Act`
           : contextLower.includes('criminal procedure') || contextLower.includes('crpc') || sectionMatch[1] === '125'
           ? `Section ${sectionMatch[1]} of the Code of Criminal Procedure`
           : `Section ${sectionMatch[1]}`)
        : '';
      
      // Identify authority
      let authority = '';
      if (contextLower.includes('family court')) {
        authority = 'the Family Court';
      } else if (contextLower.includes('supreme court') || (contextLower.includes('this court') && event.context.includes('Supreme'))) {
        authority = 'the Supreme Court';
      } else if (contextLower.includes('high court')) {
        authority = 'the High Court';
      } else if (contextLower.includes('court')) {
        authority = 'the Court';
      }
      
      // Build natural language sentence
      const sentenceParts: string[] = [];
      
      if (contextLower.includes('awarded') || contextLower.includes('award')) {
        const maintenanceType = contextLower.includes('interim maintenance') 
          ? 'interim maintenance' 
          : contextLower.includes('maintenance')
          ? 'maintenance'
          : null;
        
        if (authority && maintenanceType) {
          if (amountMatches.length > 0) {
            if (amountMatches.length === 1 && amountMatches[0].recipient) {
              sentenceParts.push(`${authority} awarded ${maintenanceType} of ${amountMatches[0].amount} per month to ${amountMatches[0].recipient}`);
            } else if (amountMatches.length === 2 && amountMatches[0].recipient && amountMatches[1].recipient) {
              sentenceParts.push(`${authority} awarded ${maintenanceType} of ${amountMatches[0].amount} per month to ${amountMatches[0].recipient} and ${amountMatches[1].amount} per month to ${amountMatches[1].recipient}`);
            } else {
              const amounts = amountMatches.map(m => m.amount);
              sentenceParts.push(`${authority} awarded ${maintenanceType} of ${amounts.length === 1 ? amounts[0] : `${amounts[0]} and ${amounts[1]}`} per month`);
            }
          } else {
            sentenceParts.push(`${authority} awarded ${maintenanceType}`);
          }
        } else if (authority) {
          sentenceParts.push(`${authority} awarded`);
        }
      } else if (contextLower.includes('directed')) {
        if (authority) {
          if (contextLower.includes('pay') || contextLower.includes('payment')) {
            if (amountMatches.length > 0 && amountMatches[0].recipient) {
              sentenceParts.push(`${authority} directed payment of ${amountMatches[0].amount} to ${amountMatches[0].recipient}`);
            } else if (amountMatches.length > 0) {
              sentenceParts.push(`${authority} directed payment of ${amountMatches[0].amount}`);
            } else {
              sentenceParts.push(`${authority} directed payment`);
            }
          } else {
            sentenceParts.push(`${authority} issued directions`);
          }
        }
      } else if (contextLower.includes('ordered')) {
        if (authority) {
          if (contextLower.includes('arrears')) {
            sentenceParts.push(`${authority} ordered payment of arrears${amountMatches.length > 0 ? ` amounting to ${amountMatches[0].amount}` : ''}`);
          } else if (contextLower.includes('maintenance')) {
            if (amountMatches.length > 0 && amountMatches[0].recipient) {
              sentenceParts.push(`${authority} ordered maintenance of ${amountMatches[0].amount} per month to ${amountMatches[0].recipient}`);
            } else if (amountMatches.length > 0) {
              sentenceParts.push(`${authority} ordered maintenance of ${amountMatches[0].amount} per month`);
            } else {
              sentenceParts.push(`${authority} ordered maintenance`);
            }
          } else if (contextLower.includes('compliance') || contextLower.includes('affidavit')) {
            sentenceParts.push(`${authority} ordered filing of compliance affidavit`);
          } else {
            sentenceParts.push(`${authority} issued an order`);
          }
        }
      } else if (contextLower.includes('amended')) {
        if (sectionInfo) {
          sentenceParts.push(`${sectionInfo} was amended`);
        } else {
          sentenceParts.push('A statutory amendment was made');
        }
      } else if (contextLower.includes('filed')) {
        if (contextLower.includes('affidavit')) {
          sentenceParts.push('An affidavit was filed');
        } else if (contextLower.includes('application')) {
          sentenceParts.push('An application was filed');
        } else {
          sentenceParts.push('A filing was made');
        }
      } else if (contextLower.includes('decided')) {
        if (authority) {
          sentenceParts.push(`${authority} delivered a judgment`);
        } else {
          sentenceParts.push('A judgment was delivered');
        }
      } else if (contextLower.includes('dismissed')) {
        if (authority) {
          sentenceParts.push(`${authority} dismissed the case`);
        } else {
          sentenceParts.push('The case was dismissed');
        }
      } else {
        if (authority) {
          sentenceParts.push(`${authority} took action`);
        } else {
          sentenceParts.push('Legal action was taken');
        }
      }
      
      let mainSentence = sentenceParts.length > 0 
        ? sentenceParts.join(' ') + '.'
        : 'A legal event occurred.';
      
      // Capitalize first letter
      if (mainSentence && mainSentence.length > 0) {
        mainSentence = mainSentence.charAt(0).toUpperCase() + mainSentence.slice(1);
      }
      
      // Build detailed additional information (2-3 more lines)
      const additionalInfo: string[] = [];
      
      // Extract more context for vague actions - be very specific
      if (!sentenceParts.length || 
          mainSentence.toLowerCase().startsWith('legal action') || 
          mainSentence.toLowerCase().startsWith('an order was issued') || 
          mainSentence.toLowerCase().startsWith('a judgment was delivered') ||
          mainSentence.toLowerCase().startsWith('the court took action')) {
        
        // Check for amendment/provision insertion
        if (contextLower.includes('amendment') || contextLower.includes('amended') || contextLower.includes('inserted')) {
          if (sectionInfo) {
            if (contextLower.includes('60 days') || contextLower.includes('disposal')) {
              mainSentence = `${sectionInfo} was amended to insert provisions requiring disposal of maintenance applications within 60 days.`;
            } else if (contextLower.includes('proviso')) {
              mainSentence = `${sectionInfo} was amended by inserting a proviso regarding maintenance proceedings.`;
            } else {
              mainSentence = `${sectionInfo} was amended by inserting new provisions.`;
            }
          } else {
            mainSentence = 'A statutory amendment was made to maintenance provisions.';
          }
        }
        // Check for writ petition
        else if (contextLower.includes('writ petition') || contextLower.includes('petition')) {
          if (contextLower.includes('dismissed')) {
            if (contextLower.includes('high court')) {
              mainSentence = `The High Court dismissed the writ petition challenging the Family Court order.`;
            } else {
              mainSentence = `${authority || 'The Court'} dismissed the writ petition.`;
            }
          } else if (contextLower.includes('filed')) {
            mainSentence = `A writ petition was filed before ${authority || 'the Court'} challenging the maintenance order.`;
          } else {
            mainSentence = `${authority || 'The Court'} dealt with a writ petition in the maintenance matter.`;
          }
        }
        // Check for appeal decisions
        else if (contextLower.includes('appeal')) {
          let appealType: string | null = null;
          let appealNum: string | null = null;
          
          const appealMatch = event.context.match(/(?:Criminal|Civil)\s+Appeal\s+(?:No\.?\s*)?(\d+(?:\/\d+)?)/i);
          if (appealMatch) {
            appealNum = appealMatch[1];
            if (appealMatch[0].toLowerCase().includes('criminal')) {
              appealType = 'Criminal';
            } else {
              appealType = 'Civil';
            }
          } else if (contextLower.includes('criminal appeal')) {
            appealType = 'Criminal';
          } else if (contextLower.includes('civil appeal')) {
            appealType = 'Civil';
          }
          
          if (contextLower.includes('affirmed')) {
            if (appealNum && appealType) {
              // Extract which court order was affirmed (general)
              let affirmedCourt = 'the lower court order';
              if (contextLower.includes('family court')) {
                affirmedCourt = 'the Family Court order';
              } else if (contextLower.includes('high court')) {
                affirmedCourt = 'the High Court order';
              }
              mainSentence = `The Supreme Court affirmed ${affirmedCourt} while deciding ${appealType} Appeal No. ${appealNum}.`;
            } else if (appealType) {
              mainSentence = `${authority || 'The Court'} affirmed the lower court's order while deciding a ${appealType.toLowerCase()} appeal.`;
            } else {
              mainSentence = `${authority || 'The Court'} affirmed the judgment of the lower court in an appeal.`;
            }
          } else if (contextLower.includes('dismissed')) {
            if (appealType) {
              mainSentence = `${authority || 'The Court'} dismissed the ${appealType.toLowerCase()} appeal and upheld the lower court's order.`;
            } else {
              mainSentence = `${authority || 'The Court'} dismissed the appeal and maintained the original order.`;
            }
          } else if (contextLower.includes('decided')) {
            if (amountMatches.length > 0) {
              mainSentence = `${authority || 'The Court'} decided an appeal regarding financial matters and payment of amounts.`;
            } else if (appealType) {
              // Extract who filed appeal (not hardcoded to husband)
              let filer = 'the appellant';
              if (contextLower.includes('petitioner')) {
                filer = 'the petitioner';
              } else if (contextLower.includes('respondent')) {
                filer = 'the respondent';
              }
              mainSentence = `${authority || 'The Court'} decided a ${appealType.toLowerCase()} appeal filed by ${filer} challenging the lower court's order.`;
            } else {
              mainSentence = `${authority || 'The Court'} decided an appeal in the matter.`;
            }
          } else {
            if (appealNum && appealType) {
              mainSentence = `${authority || 'The Court'} decided ${appealType} Appeal No. ${appealNum} in the matter.`;
            } else if (appealType) {
              mainSentence = `${authority || 'The Court'} decided a ${appealType.toLowerCase()} appeal in the case.`;
            } else {
              mainSentence = `${authority || 'The Court'} decided an appeal in the matter.`;
            }
          }
        }
        // Check for judgment decisions (general)
        else if (contextLower.includes('judgment') || (contextLower.includes('decided') && !contextLower.includes('appeal'))) {
          if (contextLower.includes('affirmed') || contextLower.includes('upheld')) {
            mainSentence = `${authority || 'The Court'} affirmed the judgment of the lower court.`;
          } else if (contextLower.includes('reversed') || contextLower.includes('set aside') || contextLower.includes('quashed')) {
            mainSentence = `${authority || 'The Court'} reversed the judgment of the lower court.`;
          } else if (contextLower.includes('modified') || contextLower.includes('varied')) {
            mainSentence = `${authority || 'The Court'} modified the judgment of the lower court.`;
          } else if (amountMatches.length > 0) {
            mainSentence = `${authority || 'The Court'} delivered a judgment confirming amounts and payment directions.`;
          } else if (contextLower.includes('guidelines')) {
            mainSentence = `${authority || 'The Court'} delivered a judgment framing guidelines for the case.`;
          } else {
            mainSentence = `${authority || 'The Court'} delivered a judgment in the matter.`;
          }
        }
        // Check for specific orders (general)
        else if (contextLower.includes('order') || contextLower.includes('ordered')) {
          if (contextLower.includes('compliance') || contextLower.includes('affidavit')) {
            if (contextLower.includes('disclosure') || contextLower.includes('assets')) {
              mainSentence = `${authority || 'The Court'} ordered filing of an affidavit disclosing assets and liabilities.`;
            } else {
              mainSentence = `${authority || 'The Court'} ordered filing of a compliance affidavit.`;
            }
          } else if (amountMatches.length > 0) {
            if (contextLower.includes('arrears') || contextLower.includes('outstanding')) {
              mainSentence = `${authority || 'The Court'} ordered payment of arrears amounting to ${amountMatches[0].amount}.`;
            } else {
              mainSentence = `${authority || 'The Court'} issued an order regarding payment of ${amountMatches[0].amount}.`;
            }
          } else if (contextLower.includes('guidelines')) {
            mainSentence = `${authority || 'The Court'} issued an order seeking suggestions for framing guidelines.`;
          } else if (contextLower.includes('tax') || contextLower.includes('returns') || contextLower.includes('income tax')) {
            // Extract party (not hardcoded to husband)
            let party = 'the party';
            if (contextLower.includes('appellant')) {
              party = 'the appellant';
            } else if (contextLower.includes('petitioner')) {
              party = 'the petitioner';
            } else if (contextLower.includes('respondent')) {
              party = 'the respondent';
            } else if (contextLower.includes('husband')) {
              party = 'the husband';
            }
            mainSentence = `${authority || 'The Court'} issued an order directing ${party} to file Income Tax Returns and Assessment Orders.`;
          } else if (contextLower.includes('stay')) {
            mainSentence = `${authority || 'The Court'} issued a stay order.`;
          } else if (contextLower.includes('injunction')) {
            mainSentence = `${authority || 'The Court'} issued an injunction order.`;
          } else {
            mainSentence = `${authority || 'The Court'} issued an order in the matter.`;
          }
        }
        // If still vague, try to extract action from event type (general)
        else if (event.eventType) {
          const eventTypeLower = event.eventType.toLowerCase();
          if (amountMatches.length > 0) {
            mainSentence = `${authority || 'The Court'} took action in the ${eventTypeLower} matter regarding payment of ${amountMatches[0].amount}.`;
          } else if (eventTypeLower.includes('amendment')) {
            mainSentence = 'A statutory amendment was made.';
          } else {
            mainSentence = `${authority || 'The Court'} took action in the ${eventTypeLower} matter.`;
          }
        }
        // Last resort - but try to be specific (general patterns)
        else {
          if (contextLower.includes('inserted') || contextLower.includes('insertion')) {
            if (sectionInfo) {
              mainSentence = `${sectionInfo} was amended by inserting new provisions.`;
            } else {
              mainSentence = 'A statutory provision was inserted.';
            }
          } else if (contextLower.includes('guidelines')) {
            mainSentence = `${authority || 'The Court'} took action to frame guidelines.`;
          } else if (contextLower.includes('mediation')) {
            mainSentence = 'The matter was referred for mediation.';
          } else {
            mainSentence = `${authority || 'The Court'} took action in the case.`;
          }
        }
        
        // Capitalize again after modification
        if (mainSentence && mainSentence.length > 0) {
          mainSentence = mainSentence.charAt(0).toUpperCase() + mainSentence.slice(1);
        }
      }
      
      // Period information
      const periodMatch = event.context.match(/(?:from|since|w\.e\.f\.|with effect from)\s+(\d{1,2}\.\d{1,2}\.\d{4})/i);
      if (periodMatch) {
        additionalInfo.push(`The order was effective from ${periodMatch[1]}.`);
      }
      
      // Add more details about what was ordered/directed (general)
      if (contextLower.includes('directed') || contextLower.includes('ordered')) {
        if (contextLower.includes('income tax') || contextLower.includes('tax returns')) {
          // Extract party (not hardcoded to husband)
          let party = 'the party';
          if (contextLower.includes('appellant')) {
            party = 'the appellant';
          } else if (contextLower.includes('petitioner')) {
            party = 'the petitioner';
          } else if (contextLower.includes('respondent')) {
            party = 'the respondent';
          } else if (contextLower.includes('husband')) {
            party = 'the husband';
          }
          additionalInfo.push(`${party.charAt(0).toUpperCase() + party.slice(1)} was directed to file Income Tax Returns and Assessment Orders.`);
        }
        
        if (contextLower.includes('passport')) {
          let party = 'the party';
          if (contextLower.includes('appellant')) {
            party = 'the appellant';
          } else if (contextLower.includes('petitioner')) {
            party = 'the petitioner';
          }
          additionalInfo.push(`${party.charAt(0).toUpperCase() + party.slice(1)} was directed to provide a photocopy of the passport.`);
        }
        
        if (contextLower.includes('pay') || contextLower.includes('payment')) {
          if (amountMatches.length > 1) {
            const totalAmounts = amountMatches.slice(0, 2).map(m => m.amount).join(', ');
            additionalInfo.push(`The order involved multiple payments: ${totalAmounts}.`);
          }
        }
      }
      
      // Add details about arrears
      if (contextLower.includes('arrears')) {
        if (amountMatches.length > 0) {
          const arrearsAmount = amountMatches[amountMatches.length - 1].amount;
          if (!mainSentence.includes(arrearsAmount)) {
            additionalInfo.push(`The order addressed payment of arrears amounting to ${arrearsAmount}.`);
          }
        } else if (contextLower.includes('part') && contextLower.includes('paid')) {
          additionalInfo.push('It was noted that only part of the arrears had been paid, and a final opportunity was granted.');
        } else if (contextLower.includes('balance')) {
          additionalInfo.push('A final opportunity was granted to pay the balance amount, failing which contempt proceedings would be initiated.');
        }
      }
      
      // Add section/statute information (general)
      if (sectionInfo && !mainSentence.toLowerCase().includes('section')) {
        if (contextLower.includes('amendment') && (contextLower.includes('60 days') || contextLower.includes('disposal'))) {
          // Extract what type of applications (not hardcoded to maintenance)
          let appType = 'applications';
          if (contextLower.includes('maintenance')) {
            appType = 'maintenance applications';
          } else if (contextLower.includes('petition')) {
            appType = 'petitions';
          } else if (contextLower.includes('appeal')) {
            appType = 'appeal applications';
          }
          additionalInfo.push(`The amendment inserted provisions requiring disposal of ${appType} within 60 days.`);
        } else if (!contextLower.includes('amendment')) {
          additionalInfo.push(`This order was passed under ${sectionInfo}.`);
        }
      }
      
      // Add details about appeals/challenges (general)
      if (contextLower.includes('challenged') || contextLower.includes('impugn')) {
        // Extract who challenged
        let challenger = 'The appellant';
        if (contextLower.includes('petitioner')) {
          challenger = 'The petitioner';
        } else if (contextLower.includes('respondent')) {
          challenger = 'The respondent';
        } else if (contextLower.includes('husband')) {
          challenger = 'The husband';
        } else if (contextLower.includes('wife')) {
          challenger = 'The wife';
        }
        
        // Extract which court order
        let challengedCourt = 'the lower court order';
        if (contextLower.includes('family court')) {
          challengedCourt = 'the Family Court order';
        } else if (contextLower.includes('high court') && !contextLower.includes('challenged')) {
          challengedCourt = 'the High Court order';
        }
        
        // Extract where challenged
        if (contextLower.includes('high court')) {
          let courtName = 'the High Court';
          if (event.context.includes('Bombay')) {
            courtName = 'the Bombay High Court';
          } else if (event.context.includes('Delhi')) {
            courtName = 'the Delhi High Court';
          } else if (event.context.includes('Madras')) {
            courtName = 'the Madras High Court';
          }
          additionalInfo.push(`${challenger} challenged ${challengedCourt} before ${courtName}.`);
        } else if (contextLower.includes('supreme court')) {
          additionalInfo.push(`${challenger} challenged ${challengedCourt} before the Supreme Court.`);
        } else {
          additionalInfo.push(`${challenger} challenged ${challengedCourt}.`);
        }
      }
      
      // Add mediation details
      if (contextLower.includes('mediation')) {
        if (contextLower.includes('failed')) {
          additionalInfo.push('Mediation attempts failed, and the matter proceeded for final hearing.');
        } else {
          additionalInfo.push('The matter was referred for mediation to resolve disputes.');
        }
      }
      
      // Add compliance/affidavit details
      if (contextLower.includes('compliance') || contextLower.includes('affidavit')) {
        if (contextLower.includes('disclosure') || contextLower.includes('assets')) {
          additionalInfo.push('The order required filing of an affidavit disclosing assets and liabilities.');
        } else if (contextLower.includes('filed')) {
          additionalInfo.push('An affidavit of compliance was filed stating the status of payments.');
        }
      }
      
      // Add details about maintenance recipients if multiple
      if (amountMatches.length > 1) {
        const recipients = amountMatches.filter(m => m.recipient).map(m => m.recipient);
        if (recipients.length > 1 && recipients.includes('the wife') && recipients.includes('the son')) {
          additionalInfo.push(`Maintenance was awarded separately to ${recipients.filter((v, i, a) => a.indexOf(v) === i).join(' and ')}.`);
        }
      }
      
      // Return 1-4 lines with details
      const result = [mainSentence];
      if (additionalInfo.length > 0) {
        result.push(...additionalInfo.slice(0, 3)); // Add up to 3 more lines
      }
      
      return result;
    }

    return [];
  };

  const categorizeEvent = (event: TimelineEvent): string => {
    const context = (event.context?.toLowerCase() || '');
    const eventType = (event.eventType?.toLowerCase() || '');

    // Supreme Court and High Court Judgments
    if ((context.includes('supreme court') || context.includes('high court')) && 
        (context.includes('judgment') || context.includes('decided'))) {
      return 'Appellate Judgment';
    }

    // Family Court Orders
    if (context.includes('family court') && 
        (context.includes('order') || context.includes('awarded') || context.includes('directed'))) {
      return 'Family Court Order';
    }

    // Maintenance Orders
    if (context.includes('maintenance') && 
        (context.includes('interim') || context.includes('awarded') || context.includes('amount'))) {
      return 'Maintenance Order';
    }

    // Appeals and Revisions
    if (context.includes('appeal') || context.includes('revision') || 
        context.includes('crl. rev.') || context.includes('slp')) {
      return 'Legal Appeal';
    }

    // Statutory Amendments
    if (context.includes('section') && 
        (context.includes('amended') || context.includes('insertion') || context.includes('w.e.f'))) {
      return 'Statutory Amendment';
    }

    // Compliance and Enforcement
    if (context.includes('compliance') || context.includes('arrears') || 
        context.includes('directed to pay') || context.includes('affidavit')) {
      return 'Compliance Matter';
    }

    // Interim Applications
    if (context.includes('interim') || context.includes('application') || 
        context.includes('petition filed')) {
      return 'Interim Proceeding';
    }

    // Default for unclassified events
    return 'Court Proceeding';
  };

  // Generate precise event title
  const getEventTitle = (event: TimelineEvent): string => {
    const context = event.context?.toLowerCase() || '';

    // Court-specific titles
    if (context.includes('supreme court')) {
      return 'Supreme Court';
    }
    if (context.includes('high court')) {
      return 'High Court';
    }
    if (context.includes('family court')) {
      return 'Family Court';
    }

    // Order and maintenance titles
    if (context.includes('interim maintenance')) {
      return 'Interim Maintenance';
    }
    if (context.includes('maintenance') && context.includes('awarded')) {
      return 'Maintenance Award';
    }

    // Appeal and revision titles
    if (context.includes('criminal appeal')) {
      return 'Criminal Appeal';
    }
    if (context.includes('civil appeal')) {
      return 'Civil Appeal';
    }
    if (context.includes('revision petition') || context.includes('crl. rev.')) {
      return 'Revision Petition';
    }
    if (context.includes('slp')) {
      return 'Special Leave Petition';
    }

    // Statutory references
    if (context.includes('section') && context.includes('amended')) {
      return 'Statutory Amendment';
    }

    // Applications and proceedings
    if (context.includes('application filed')) {
      return 'Application Filed';
    }
    if (context.includes('affidavit')) {
      return 'Affidavit Filed';
    }
    if (context.includes('compliance')) {
      return 'Compliance Report';
    }

    // Use category as fallback
    return categorizeEvent(event);
  };

  // Sort events by date and deduplicate
  const sortedEvents = useMemo(() => {
    // First filter and sort
    const filtered = [...events]
      .filter(event => event.context && !event.context.includes('www.manupatra.com'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by date and merge similar events
    const groupedByDate = new Map<string, TimelineEvent[]>();

    for (const event of filtered) {
      const dateKey = event.date.split('T')[0];
      const dateEvents = groupedByDate.get(dateKey) || [];
      dateEvents.push(event);
      groupedByDate.set(dateKey, dateEvents);
    }

    // For each date, keep only unique events (merge similar ones)
    const deduplicated: TimelineEvent[] = [];

    for (const [, dateEvents] of groupedByDate) {
      if (dateEvents.length === 1) {
        deduplicated.push(dateEvents[0]);
      } else {
        // For multiple events on same date, keep the one with most detailed context
        const bestEvent = dateEvents.reduce((best, current) => {
          const bestContext = best.context || '';
          const currentContext = current.context || '';
          return currentContext.length > bestContext.length ? current : best;
        }, dateEvents[0]);
        deduplicated.push(bestEvent);
      }
    }

    return deduplicated;
  }, [events]);

  // Helper to format date for display (DD.MM.YYYY or use ISO date)
  const formatDateForDisplay = (dateStr: string): string => {
    try {
      // If already in DD.MM.YYYY format, return as is
      if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr)) {
        return dateStr;
      }
      // Parse ISO format and convert to DD.MM.YYYY
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      }
    } catch (e) {
      // Fallback to ISO date format
    }
    return dateStr.split('T')[0];
  };


  if (!events?.length) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-600 bg-white rounded-lg border border-gray-200 shadow-sm">
        <p>No timeline events to display</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Custom Timeline Diagram */}
      <CustomTimeline
        events={sortedEvents}
        categorizeEvent={categorizeEvent}
        getEventTitle={getEventTitle}
        extractSummary={extractSummary}
        formatDateForDisplay={formatDateForDisplay}
      />



      {/* Timeline Events Section - Commented out as requested */}
      {/* 
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline Events</h3>
        <div className="space-y-4">
          {sortedEvents.map((event) => {
            const summaryLines = extractSummary(event);
            const category = categorizeEvent(event);
            const displayText = summaryLines.join(' ') || event.eventName;

            return (
              <div
                key={event.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 text-sm">
                  <div className="text-gray-600 font-medium">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {category}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-gray-900 font-medium">{getEventTitle(event)}</div>
                  {displayText && (
                    <div className="mt-2 text-gray-700 text-sm leading-snug bg-blue-50 p-3 rounded overflow-hidden">
                      <div style={{
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxHeight: '6em', // Increased from 3.5em to 6em
                        lineHeight: '1.6',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 4, // Allow up to 4 lines
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {displayText}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      */}

      <div className="flex items-center justify-between text-sm text-gray-500 px-4">
        <div>Total Events: {sortedEvents.length}</div>
        <div>✨ Dynamic Timeline Visualization</div>
      </div>
    </div>
  );
}