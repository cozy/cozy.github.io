import React from 'react'

function SvgIconCredit(props) {
  return (
    <svg width={16} height={16} {...props}>
      <g fill="#32363F" fillRule="evenodd">
        <path
          fillRule="nonzero"
          d="M3.414 10H11a1 1 0 010 2H3.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 1.414L3.414 10z"
          opacity={0.5}
        />
        <path d="M12.586 4l-1.293-1.293a1 1 0 111.414-1.414l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L12.586 6H5a1 1 0 110-2h7.586z" />
      </g>
    </svg>
  )
}

export default SvgIconCredit
