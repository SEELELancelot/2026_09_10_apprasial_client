const CheckApprasialModal = (props) => {
  const blankArray = props?.checkExcelData?.blankArray;

  return (
    <div>
      {
        blankArray.length === 0 ?
          <h3 style={{textAlign: 'center', color: 'blue'}}>檢核無誤</h3> :
          <h3 style={{textAlign: 'center', color: 'red'}}>{blankArray.length}人資料異常</h3>
      }

      {
        blankArray.map((item) => {
          const sheet = item?.sheet
          console.log(sheet)
          const {employeeName, isManager, scores} = sheet;
          let childDomArray = [];

          for (const scoreKey in scores) {
            console.log(scoreKey); // 領導協調能力
            // 不是主管卻填入
            if (scoreKey === "f8" && !isManager && scores[scoreKey]?.value!==null) {
              childDomArray.push(
                <>
                  <tr style={{position:'relative',backgroundColor:'pink'}}>
                    <td style={{color:'red'}}>{scores[scoreKey]?.name}  </td>
                    <td style={{color:'red'}}>{scores[scoreKey]?.value}
                      <span style={{position:'absolute',right:15,top:14 ,fontSize:'16px'}}>(不是主管)</span>
                    </td>
                  </tr>
                </>
              )
            }else if(scoreKey === "f8" && !isManager && scores[scoreKey]?.value===null){
              childDomArray.push(
                <>
                  <tr style={{position:'relative',backgroundColor:''}}>
                    <td style={{color:'black'}}>{scores[scoreKey]?.name}  </td>
                    <td style={{color:'black'}}>{scores[scoreKey]?.value}
                      <span style={{position:'absolute',right:15,top:14 ,fontSize:'16px'}}></span>
                    </td>
                  </tr>
                </>
              )
            }
            //   是主管卻沒有填入
            else if(scoreKey === "f8" && isManager && scores[scoreKey]?.value===null){
              childDomArray.push(
                <>
                  <tr style={{position:'relative',backgroundColor:'pink'}}>
                    <td style={{color:'red'}}>{scores[scoreKey]?.name}  </td>
                    <td style={{color:'red'}}>{scores[scoreKey]?.value}
                      <span style={{position:'absolute',right:15,top:14 ,fontSize:'16px'}}>(未填)</span>
                    </td>
                  </tr>
                </>
              )
            } else{
              console.log(scoreKey, isManager,scores[scoreKey]?.value);
              childDomArray.push(
                <tr style={{position:'relative'}}>
                <td>{scores[scoreKey]?.name}</td>
                  <td>
                    {scores[scoreKey]?.value ? scores[scoreKey]?.value.length > 10 ? `${scores[scoreKey]?.value.slice(0, 10)}...` : scores[scoreKey]?.value : null}
                    {scores[scoreKey]?.value === null && (
                      <span
                        style={{
                          position: 'absolute',
                          color: 'red',
                          right: 15,
                          top: 14,
                          fontSize: '16px',
                        }}
                      >
                  (未填)
            </span>
                    )}
                  </td>
                </tr>
              )
            }
          }
            return (
            <table key={employeeName} className={"apprasial_checkExcel_Table"}>
              <tr>
                <td colSpan={2}>{employeeName}</td>
              </tr>
              {childDomArray}

            </table>
          )
        })
      }

    </div>
  )
}
export default CheckApprasialModal;
