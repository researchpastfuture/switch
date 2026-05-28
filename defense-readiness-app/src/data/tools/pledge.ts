// Section 9 — pledge-commitment-tracker. Selectable commitments -> printable pledge.
export interface PledgeCommitment {
  id: string;
  text: string;
}

export interface PledgeData {
  intro: string;
  commitments: PledgeCommitment[];
}

export const pledge: PledgeData = {
  intro: 'I commit to the following in support of family and community renewal:',
  commitments: [
    { id: 'family-time', text: 'Protect regular, device-free family time.' },
    { id: 'faith', text: 'Nurture faith and shared values in my household.' },
    { id: 'mentor', text: 'Mentor or support a young person in my community.' },
    { id: 'service', text: 'Give time to a local service or charitable effort.' },
    { id: 'truth', text: 'Seek out reliable information and model discernment.' },
    { id: 'neighbor', text: 'Know and support my neighbors.' },
  ],
};
